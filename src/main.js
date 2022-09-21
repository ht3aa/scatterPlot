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

function makeScatterPlotGraph(xValues, yValues) {
  const width = window.innerWidth,
    height = window.innerHeight,
    margin = { top: 100, right: 100, bottom: 100, left: 100 };

  const svg = d3
    .select("#scatterPlotGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3
    .scaleLinear()
    .domain([d3.min(xValues), d3.max(xValues)])
    .range([0 + margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([d3.min(yValues), d3.max(yValues)])
    .range([height - margin.bottom, 0 + margin.top]);

  const points = [];
  const middlePoints = [];

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
    .attr("r", 5);

  const middlePointsArr = middlePoints.map((middlePoint) => [
    middlePoint.x,
    middlePoint.y,
  ]);

  const lineGenerator = d3.line().curve(d3.curveCardinal);
  const line = lineGenerator(middlePointsArr);

  svg
    .append("path")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "black");

  svg
    .append("g")
    .call(d3.axisLeft(yScale))
    .attr("transform", `translate(${margin.left}, 0)`);
  svg
    .append("g")
    .call(d3.axisBottom(xScale))
    .attr("transform", `translate(0, ${height - margin.bottom})`);
}
