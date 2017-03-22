(function () {

  function renderLineCharts(data, container = 'body', config = {}) {
    let chartData = data.filter(datum => !datum.isDisabled);
    const containerWidth = config.width || 750;
    const containerHeight = config.height || 420;
    const margin = config.margin || { top: 20, right: 20, bottom: 50, left: 50 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;
    let svg = d3.select(container).select('svg.main-svg');
    let chartContainer = svg.select('g.chart-container');
    let tooltip = d3.select('div.tooltip');


    if (chartData.length) {

      if (svg.empty()) {
        svg = d3.select(container).append('svg')
          .attr('width', containerWidth)
          .attr('height', containerHeight)
          .classed('main-svg', true);
      }

      if (chartContainer.empty()) {
        chartContainer = svg.append('g')
          .classed('chart-container', true)
          .attr('transform', `translate( ${margin.left}, ${margin.top})`);
      }
      
      let x = d3.scalePoint()
        .padding(0.1)  
        .rangeRound([0, chartWidth])
        .domain(chartData[0].values.map(datum => datum['Date'] ));

      let y = d3.scaleLinear()
        .rangeRound([chartHeight, 0])
        .domain([0, d3.max(chartData, datum => d3.max(datum.values, (value) => parseInt(value['Time'])))]);
      
      let line = d3.line()
        .x(d => x(d['Date']))
        .y(d => y(parseInt(d['Time'])));
      

    // Define the div for the tooltip

      let xAxisTickValues = chartData[0].values.filter((datum, i) => i % 2).map(datum => datum['Date']);

      if (chartContainer.select('.x-axis').empty()) {
        chartContainer
          .append('g')
          .classed('x-axis', true)
          .attr('transform', `translate(0, ${chartHeight})`)
          .call(d3.axisBottom(x).tickValues(xAxisTickValues))
          .append('text')
          .attr('fill', '#fff')
          .attr('x', chartWidth / 2)
          .attr('y', margin.bottom / 2)
          .attr('dy', '0.71em')
          .attr('text-anchor', 'middle')
          .style('font-size', '8pt')
          .style('font-weight', 'bold')
          .text('Date');
      }

      if (chartContainer.select('.y-axis').empty()) {
        chartContainer
          .append('g')
          .classed('y-axis', true)
          .call(d3.axisLeft(y))
          .append('text')
          .attr('fill', '#fff')
          .attr('transform', 'rotate(-90)')
          .attr('x', -1 * (chartHeight / 2))
          .attr('y', -1 * margin.left / 2)
          .attr('dy', '-0.71em')
          .attr('text-anchor', 'middle')
          .style('font-size','8pt')
          .style('font-weight', 'bold')
          .text('Response Time (m/s)');
      }


      // chartData.forEach((datum, i) => {
        chartData.forEach((datum,i) => {
        chartContainer
          .append('path')
          .datum(datum.values)
          .classed('line', true)
          .attr('fill', 'none')
          // .attr('stroke', config.lineColor[i] || 'steelblue')
          .attr('stroke', config.colorMap[datum.key] || 'steelblue')
          .attr('stroke-linejoin', config.lineJoin || 'round')
          .attr('stroke-linecap', config.lineCap || 'round')
          .attr('stroke-width', config.strokeWidth || 5.0)
          .attr('d', line);

        // Add the scatterplot
        chartContainer.append('g')
          .selectAll('.dot')
          .data(datum.values)
          .enter()
          // .append('circle')
          .append('circle')
          .classed('dot', true)
          .style('opacity',0)
          .attr('r', 5)
          .attr('cx', d => x(d['Date']))
          .attr('cy', d => y(parseInt(d['Time'])))
          .style('fill', config.colorMap[datum.key])
          .on('mouseover', d => {
            d3.select(d3.event.target).style('opacity', 1);
            tooltip.transition()		
              .duration(300)		
              .style('opacity', .9)
              .style('left', `${d3.event.pageX}px`)
              .style('top', `${d3.event.pageY - 75}px`)
              .style('border', `1px solid`);

             tooltip.html(`Date: ${d['Date']}<br/>  Event: ${d['Event']}<br/> Time: ${d['Time']}`);
            })					
          .on('mouseout', d => {
            d3.select(d3.event.target).style('opacity', 0);
            tooltip.transition()
              .duration(500)
              .style('opacity', 0);	
          });
      }); 
    }
    
    // Rendering Filters
    let activeFilters = data.filter(datum => !datum['isDisabled'])
      .map(datum => datum.key);
    
  if(d3.select('#events').selectAll('button').empty())
    d3.select('#events')
      .selectAll('button')
      .data(data.map(datum => datum.key))
      .enter()
      .append('button')
      .classed('btn btn-primary', true)
      .html(datum => `${datum} <span class="badge">${(new Date()).toLocaleTimeString()}</span>`)
      .style('margin', '10px')
      .style('text-align', 'center')
      .on('click', d => {
        let targetElement = d3.select(d3.event.target);
        d3.select(container).selectAll('.line').remove();
        d3.select('#filters').selectAll('*').remove();
        d3.select('#legends').selectAll('*').remove();

        d3.selectAll('#events button.btn-default')
          .classed('btn-default', false)
          .classed('btn-primary', true);
        
        targetElement.classed('btn-primary', false)
          .classed('btn-default', true)
          .html(`${d} <span class="badge">${(new Date()).toLocaleTimeString()}</span>`);

        
        let newChartData = data.map(datum => {
          if (datum.key === d) {
            datum['isDisabled'] = false;
            return datum;
          }
          else {
            datum['isDisabled'] = true;
            return datum;
          }
        });

        renderLineCharts(newChartData, container, config);
      });
    
    //Rendering Select All Button
    // $('#filters .list-group')
    //   .prepend('<li class="list-group-item"></li>')
    //   .children('li:nth-child(1)')
    //   .html(`<span class="glyphicon ${(chartData.length === data.length) ? 'glyphicon-check' : 'glyphicon-unchecked'}" aria-hidden="true"></span>All`)
    //   .on('click', function(e) {

    //     if ($(this).find('span').hasClass("glyphicon-check")) {
    //       d3.select(container).selectAll('.line').remove();
    //       $('#filters').empty();
    //       $('#legends').empty();
          
    //       let newChartData = data.map(datum => {
    //         datum['isDisabled'] = true;
    //         return datum;
    //       });
    //       renderLineCharts(newChartData, container, config);

    //     } else {
    //       d3.select(container).selectAll('.line').remove();
    //       $('#filters').empty();
    //       $('#legends').empty();
          
    //       let newChartData = data.map(datum => {
    //         datum['isDisabled'] = false;
    //         return datum;
    //       });
    //       renderLineCharts(newChartData, container, config);

    //     }
    //   });
    
    //Rendering Color Legends
    d3.select('#legends')
      .append('ul')
      .classed('list-group', true)
      .selectAll('li.list-group-item')
      .data(data.map(datum => datum.key))
      .enter()
      .append('li')
      .classed('list-group-item', true)
      .html((datum, i) => `<span class="glyphicon glyphicon-stop" 
      aria-hidden="true" style="color: ${config.colorMap[datum]}" ></span> ${datum}`);
  }

  d3.csv('./People_Data.csv',(err, data) => {
    if (err)
      return err;  

    let chartData = d3.nest()
      .key(datum => datum['Event'])
      .entries(data);
    console.log(chartData);
    let lineColor = ['#0477AD', '#F78203', '#079E24', '#E62E2A', '#906AC0', '#945450','#FFFF00','#3933FF'];
    let colorMap = new Object();
    chartData.forEach((entry,i) => {
     colorMap[entry.key] = lineColor[i];
   } )

   //console.log(colorMap);

   renderLineCharts(chartData, '#chart-container',{colorMap});
    // renderLineCharts(chartData, '#chart-container', {
      // lineColor: ['#0477AD', '#F78203', '#079E24', '#E62E2A', '#906AC0', '#945450','#FFFF00','#3933FF']
    // });
  });

})();
