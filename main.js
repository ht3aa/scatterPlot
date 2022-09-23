const addValueBtn = document.getElementById("addValueBtn");
const submitBtn = document.getElementById("submitBtn");
const scatterPlotForm = document.getElementById("scatterPlotForm");
const textarea = document.getElementById("textarea");

scatterPlotForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const values = textarea.value.split(/\n/).reduce((accumulator, val) => {
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

  makeScatterPlotGraph(xValues, yValues);
});

function calculateCorrelation(selectore, xValues, yValues) {
  const valuseNumber = xValues.length;
  const columns = ["n", "x", "y", "xy", "x2", "y2"];

  const table = selectore.append("table").attr("class", "mx-auto mb-10");
  const theadrow = table.append("thead").append("tr").attr("class", "border-2");

  for (let i = 0; i < columns.length; i++) {
    if (columns[i].includes("2")) {
      theadrow
        .append("th")
        .attr("class", "border-2 p-3 text-xl")
        .text(columns[i][0])
        .append("sup")
        .text("2");
    } else {
      theadrow
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
  for (let i = 0; i < valuseNumber; i++) {
    let row = tbody.append("tr");

    row
      .append("td")
      .attr("class", "text-center")
      .text(i + 1);

    xSummation += xValues[i];
    row.append("td").attr("class", "text-center").text(xValues[i]);

    ySummation += yValues[i];
    row.append("td").attr("class", "text-center").text(xValues[i]);

    xySummation += xValues[i] * yValues[i];
    row
      .append("td")
      .attr("class", "text-center")
      .text(xValues[i] * yValues[i]);

    x2Summation += xValues[i] ** 2;
    row
      .append("td")
      .attr("class", "text-center")
      .text(xValues[i] ** 2);

    y2Summation += yValues[i] ** 2;
    row
      .append("td")
      .attr("class", "text-center")
      .text(yValues[i] ** 2);
  }

  const tfoot = table.append("tfoot");
  const tfootrow = tfoot.append("tr").attr("class", "font-bold");

  tfootrow.append("td").attr("class", "text-center px-2").text("Totals:");
  tfootrow.append("td").attr("class", "text-center px-2").text(xSummation);
  tfootrow.append("td").attr("class", "text-center px-2").text(ySummation);
  tfootrow.append("td").attr("class", "text-center px-2").text(xySummation);
  tfootrow.append("td").attr("class", "text-center px-2").text(x2Summation);
  tfootrow.append("td").attr("class", "text-center px-2").text(y2Summation);

  let correlation =
    (valuseNumber * xySummation - xSummation * ySummation) /
    (Math.sqrt(valuseNumber * x2Summation - xSummation ** 2) *
      Math.sqrt(valuseNumber * y2Summation - ySummation ** 2));

  tfoot
    .append("tr")
    .append("td")
    .attr("colspan", "6")
    .attr("class", "text-center font-bold text-blue-700 py-2")
    .text("r = " + correlation);
}

function makeScatterPlotGraph(xValues, yValues) {
  const width = window.innerWidth,
    height = window.innerHeight,
    margin = { top: 100, right: 100, bottom: 100, left: 100 };

  const points = [];
  const middlePoints = [];

  const lineGenerator = d3.line().curve(d3.curveCardinal);

  const div = d3.select("#scatterPlotGraph").append("div");
  const svg = div.append("svg").attr("width", width).attr("height", height);

  const xScale = d3
    .scaleLinear()
    .domain([d3.min(xValues), d3.max(xValues)])
    .range([0 + margin.left, width - margin.right]);

  const xScaleRev = d3
    .scaleLinear()
    .domain([0 + margin.left, width - margin.right])
    .range([d3.min(xValues), d3.max(xValues)]);

  const yScale = d3
    .scaleLinear()
    .domain([d3.min(yValues), d3.max(yValues)])
    .range([height - margin.bottom, 0 + margin.top]);

  const yScaleRev = d3
    .scaleLinear()
    .domain([height - margin.bottom, 0 + margin.top])
    .range([d3.min(yValues), d3.max(yValues)]);

  for (let i = 0; i < xValues.length; i++) {
    points.push({ x: xScale(xValues[i]), y: yScale(yValues[i]) });
  }

  points.sort(function (a, b) {
    return d3.ascending(a.x, b.x);
  });

  for (let i = 0; i < xValues.length; i += 2) {
    middlePoints.push({
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    });
  }

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

  const middlePointsArr = middlePoints.map((middlePoint) => [
    middlePoint.x,
    middlePoint.y,
  ]);

  const line = lineGenerator(middlePointsArr);

  svg.append("path").attr("d", line).attr("fill", "none").attr("stroke", "red");

  svg
    .append("g")
    .call(d3.axisLeft(yScale))
    .attr("transform", `translate(${margin.left}, 0)`);
  svg
    .append("g")
    .call(d3.axisBottom(xScale))
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  // div.append("table")

  calculateCorrelation(div, xValues, yValues);
  div
    .append("button")
    .attr(
      "class",
      "mb-10 ml-20 bg-red-600 py-2 px-5 text-white hover:bg-red-800"
    )
    .attr("onclick", "removeChart(this)")
    .text("Remove chart");

  d3.select("#indication")
    .attr("class", "mt-3 text-blue-600 font-bold")
    .text("There are charts above. scroll up to see them");
}

function removeChart(target) {
  const divElement = target.parentNode;

  divElement.remove();

  if (d3.select("#scatterPlotGraph").selectChildren()._groups[0].length === 0) {
    d3.select("#indication")
      .attr("class", "mt-3 text-blue-600 font-bold")
      .text("");
  }
}
