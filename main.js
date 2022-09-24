const scatterPlotForm = document.getElementById("scatterPlotForm");
const indicationElement = d3
  .select("#indication")
  .attr("class", "mt-3 text-blue-600 font-bold");

scatterPlotForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const textarea = document.getElementById("textarea");
  const res = extractValues(textarea);

  if (res.err) {
    indicationElement
      .attr("class", "mt-3 px-5 text-center text-red-600 font-bold")
      .text(res.msg);
  } else {
    makeScatterPlotGraph(res.xValues, res.yValues);
  }
});

function extractValues(element) {
  let res = { xValues: [], yValues: [], err: false, msg: "" };

  const values = element.value.split(/\n/).reduce((accumulator, val) => {
    if (val === "") return accumulator;
    else {
      let splitted = val.split(",");
      accumulator.push({
        x: parseFloat(splitted[0]),
        y: parseFloat(splitted[1]),
      });
      return accumulator;
    }
  }, []);

  const xValues = values.map((val) => val.x);
  const yValues = values.map((val) => val.y);

  if (xValues.includes(NaN)) {
    res.err = true;
    res.msg = "x column is missing one or more values to equal y column";
  } else if (yValues.includes(NaN)) {
    res.err = true;
    res.msg = "y column is missing one or more values to equal x column";
  }

  res.xValues = xValues;
  res.yValues = yValues;

  return res;
}

function makeScatterPlotGraph(xValues, yValues) {
  const width = window.innerWidth,
    height = window.innerHeight,
    margin = { top: 100, right: 100, bottom: 100, left: 100 },
    dataLength = xValues.length,
    points = [],
    middlePoints = [],
    lineGenerator = d3.line().curve(d3.curveCardinal), // TODO: refactor
    div = d3.select("#scatterPlotGraph").append("div").attr("class", "w-full"),
    svg = div.append("svg").attr("width", width).attr("height", height),
    xScale = d3
      .scaleLinear()
      .domain([d3.min(xValues), d3.max(xValues)])
      .range([0 + margin.left, width - margin.right]),
    xScaleRev = d3
      .scaleLinear()
      .domain([0 + margin.left, width - margin.right])
      .range([d3.min(xValues), d3.max(xValues)]),
    yScale = d3
      .scaleLinear()
      .domain([d3.min(yValues), d3.max(yValues)])
      .range([height - margin.bottom, 0 + margin.top]),
    yScaleRev = d3
      .scaleLinear()
      .domain([height - margin.bottom, 0 + margin.top])
      .range([d3.min(yValues), d3.max(yValues)]);

  for (let i = 0; i < dataLength; i++) {
    points.push({ x: xScale(xValues[i]), y: yScale(yValues[i]) });
  }

  points.sort(function (a, b) {
    return d3.ascending(a.x, b.x);
  });

  for (let i = 0; i < dataLength; i += 2) {
    if (points[i] && points[i + 1]) {
      middlePoints.push([
        (points[i].x + points[i + 1].x) / 2,
        (points[i].y + points[i + 1].y) / 2,
      ]);
    }
  }

  const line = lineGenerator(middlePoints);

  svg.append("path").attr("d", line).attr("fill", "none").attr("stroke", "red");

  svg
    .append("g")
    .call(d3.axisLeft(yScale))
    .attr("transform", `translate(${margin.left}, 0)`);
  svg
    .append("g")
    .call(d3.axisBottom(xScale))
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  svg
    .append("g")
    .selectAll("circles")
    .data(points)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 7)
    .on("mouseover", function (e, i) {
      d3.select(this).attr("fill", "blue");

      svg
        .append("text")
        .attr("id", `t-${Math.floor(i.x)}`)
        .attr("x", i.x - 30)
        .attr("y", i.y - 20)
        .attr("class", "italic")
        .text(`(${Math.round(xScaleRev(i.x))},${Math.round(yScaleRev(i.y))})`);

      let lineX = lineGenerator([
        [i.x, i.y],
        [i.x, height - margin.bottom],
      ]);
      svg
        .append("path")
        .attr("d", lineX)
        .attr("id", `x-${Math.floor(i.x)}`)
        .attr("fill", "none")
        .attr("stroke", "blue");

      let lineY = lineGenerator([
        [i.x, i.y],
        [margin.left, i.y],
      ]);
      svg
        .append("path")
        .attr("d", lineY)
        .attr("id", `y-${Math.floor(i.x)}`)
        .attr("fill", "none")
        .attr("stroke", "blue");
    })
    .on("mouseleave", function (e, i) {
      d3.select(this).attr("fill", "black");
      svg.select(`#x-${Math.floor(i.x)}`).remove();
      svg.select(`#y-${Math.floor(i.x)}`).remove();
      svg.select(`#t-${Math.floor(i.x)}`).remove();
    });

  calculateCorrelation(div, xValues, yValues, dataLength);

  div
    .append("button")
    .attr(
      "class",
      "mb-10 mx-20 bg-red-600 py-2 px-5 text-white hover:bg-red-800"
    )
    .attr("onclick", "removeChart(this)")
    .text("Remove chart");

  indicationElement.text("There are charts above. scroll up to see them");
}

function calculateCorrelation(selector, xValues, yValues, dataLength) {
  const columns = [
    "n",
    "x",
    "y",
    "xy",
    "x2",
    "y2",
    "x-x̄",
    "y-ȳ",
    ["x-x̄", "2"],
    ["y-ȳ", "2"],
  ];
  const div = selector
    .append("div")
    .attr("class", "w-1/2 overflow-x-scroll mx-auto mb-10 ");
  const table = div.append("table").attr("class", "w-screen");
  selector
    .append("p")
    .attr("class", "text-center font-bold text-red-400 mb-10")
    .text("You can scroll to the right and left");
  const tHeadRow = table.append("thead").append("tr").attr("class", "border-2");

  for (let i = 0; i < columns.length; i++) {
    if (columns[i].includes("2")) {
      tHeadRow
        .append("th")
        .attr("class", "border-2 p-3 text-xl")
        .text(`(${columns[i][0]})`)
        .append("sup")
        .text("2");
    } else {
      tHeadRow
        .append("th")
        .attr("class", "border-2 p-3 text-xl")
        .text(columns[i]);
    }
  }

  const tbody = table.append("tbody");

  let xSummation = 0;
  let ySummation = 0;
  let xySummation = 0;
  let x2Summation = 0;
  let y2Summation = 0;
  let xMinusXMeanSummation = 0;
  let yMinusYMeanSummation = 0;
  let xMinusXMeanSquareSummation = 0;
  let yMinusYMeanSquareSummation = 0;
  let varianceX = 0;
  let deviationX = 0;
  let varianceY = 0;
  let deviationY = 0;
  for (let i = 0; i < dataLength; i++) {
    xSummation += xValues[i];
    ySummation += yValues[i];
  }
  let meanX = xSummation / dataLength;
  let meanY = ySummation / dataLength;
  for (let i = 0; i < dataLength; i++) {
    let row = tbody.append("tr");

    generateTDElementForTBody(row).text(i + 1);

    generateTDElementForTBody(row).text(xValues[i]);

    generateTDElementForTBody(row).text(yValues[i]);

    xySummation += xValues[i] * yValues[i];

    generateTDElementForTBody(row).text(
      parseFloat((xValues[i] * yValues[i]).toFixed(3))
    );

    x2Summation += xValues[i] ** 2;
    generateTDElementForTBody(row).text(
      parseFloat((xValues[i] ** 2).toFixed(3))
    );

    y2Summation += yValues[i] ** 2;

    generateTDElementForTBody(row).text(
      parseFloat((yValues[i] ** 2).toFixed(3))
    );

    xMinusXMeanSummation =
      parseFloat(xMinusXMeanSummation.toFixed(3)) +
      parseFloat((xValues[i] - meanX).toFixed(3));

    generateTDElementForTBody(row).text(
      parseFloat((xValues[i] - meanX).toFixed(3))
    );

    yMinusYMeanSummation =
      parseFloat(yMinusYMeanSummation.toFixed(3)) +
      parseFloat((yValues[i] - meanY).toFixed(3));

    generateTDElementForTBody(row).text(
      parseFloat((yValues[i] - meanY).toFixed(3))
    );

    xMinusXMeanSquareSummation =
      parseFloat(xMinusXMeanSquareSummation.toFixed(3)) +
      parseFloat(((xValues[i] - meanX) ** 2).toFixed(3));

    generateTDElementForTBody(row).text(
      parseFloat(((xValues[i] - meanX) ** 2).toFixed(3))
    );

    yMinusYMeanSquareSummation =
      parseFloat(yMinusYMeanSquareSummation.toFixed(3)) +
      parseFloat(((yValues[i] - meanY) ** 2).toFixed(3));

    generateTDElementForTBody(row).text(
      parseFloat(((yValues[i] - meanY) ** 2).toFixed(3))
    );
  }

  const tfoot = table.append("tfoot");
  const tFootRow = tfoot.append("tr").attr("class", "font-bold");

  tFootRow.append("td").attr("class", "text-center px-2").text("Totals:");
  tFootRow.append("td").attr("class", "text-center px-2").text(xSummation);
  tFootRow.append("td").attr("class", "text-center px-2").text(ySummation);
  tFootRow.append("td").attr("class", "text-center px-2").text(xySummation);
  tFootRow.append("td").attr("class", "text-center px-2").text(x2Summation);
  tFootRow.append("td").attr("class", "text-center px-2").text(y2Summation);
  tFootRow
    .append("td")
    .attr("class", "text-center px-2")
    .text(xMinusXMeanSummation);
  tFootRow
    .append("td")
    .attr("class", "text-center px-2")
    .text(yMinusYMeanSummation);

  tFootRow
    .append("td")
    .attr("class", "text-center px-2")
    .text(xMinusXMeanSquareSummation);
  tFootRow
    .append("td")
    .attr("class", "text-center px-2")
    .text(yMinusYMeanSquareSummation);

  let correlation =
    (dataLength * xySummation - xSummation * ySummation) /
    (Math.sqrt(dataLength * x2Summation - xSummation ** 2) *
      Math.sqrt(dataLength * y2Summation - ySummation ** 2));

  let tfootRaw1 = tfoot.append("tr");

  generateTDElementForTFoot(tfootRaw1).text(`x̄ = ${meanX}`);

  generateTDElementForTFoot(tfootRaw1).text(`ȳ = ${meanY}`);

  generateTDElementForTFoot(tfootRaw1).text(
    `Med.x = ${
      dataLength % 2 !== 0
        ? xValues[Math.floor(dataLength / 2)]
        : (xValues[dataLength / 2] + xValues[dataLength / 2 + 1]) / 2
    }`
  );

  generateTDElementForTFoot(tfootRaw1).text(
    `Med.y= ${
      dataLength % 2 !== 0
        ? yValues[Math.floor(dataLength / 2)]
        : (yValues[dataLength / 2] + yValues[dataLength / 2 + 1]) / 2
    }`
  );

  varianceX = (xMinusXMeanSquareSummation / (dataLength - 1)).toFixed(3);
  generateTDElementForTFoot(tfootRaw1).text(`s^2 for x = ${varianceX}`);

  varianceY = (yMinusYMeanSquareSummation / (dataLength - 1)).toFixed(3);
  generateTDElementForTFoot(tfootRaw1).text(`s^2 for y = ${varianceY}`);

  deviationX = Math.sqrt(varianceX).toFixed(3);
  generateTDElementForTFoot(tfootRaw1).text(` s for x = ${deviationX}`);

  deviationY = Math.sqrt(varianceY).toFixed(3);
  generateTDElementForTFoot(tfootRaw1).text(` s for y = ${deviationY}`);

  tfoot
    .append("tr")
    .append("td")
    .attr("colspan", "10")
    .attr("class", "text-center font-bold text-blue-700 py-2")
    .text("r = " + correlation);
}

function generateTDElementForTBody(row) {
  return row.append("td").attr("class", "text-center px-2");
}

function generateTDElementForTFoot(tfootRaw) {
  return tfootRaw
    .append("td")
    .attr("class", "text-center font-bold text-blue-700 px-2");
}

function removeChart(target) {
  const divElement = target.parentNode;

  divElement.remove();

  if (d3.select("#scatterPlotGraph").selectChildren()._groups[0].length === 0) {
    d3.select("#indication").text("");
  }
}
