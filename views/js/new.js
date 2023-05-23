/* eslint-disable no-console */
/* eslint-disable no-var */
/* eslint-disable prefer-template */
/* eslint-disable no-undef */
/* eslint-disable indent */

$(document).ready(function() {
    // Function to fetch data and update the chart
    function fetchDataAndUpdateChart() {
      $.ajax({
        url: 'http://localhost:3000/ticks',
        dataType: 'json',
        success: function(data) {
          const tick = data.latestTick;
          var evenTicks = data.evenTicks;
          var oddTicks = data.oddTicks;
          const even = (Math.round(data.even));
          const odd = (Math.round(data.odd));
          
          // var symbol = data.symbol;
  
          $('#latestPrice').html(tick);
          // $("#no_Ticks").val(totalTicks);
          // $("#marketsymbol").val(symbol).prop('selected', true);
          $('#evenNo').html(evenTicks);
          $('#oddNo').html(oddTicks); // corrected from $('#oddNo').val(odd);
          // Update the chart data
          chart.data.datasets[0].data = [even, odd];
          chart.update();
        },
        error: function(error) {
          console.error(error);
          setTimeout(fetchDataAndUpdateChart, 1000);
        }
      });
    }
  
    // Create the initial chart
    const ctx = document.getElementById('chart').getContext('2d');
    var chart = new Chart(ctx, { // corrected from new chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Even', 'Odd'],
        datasets: [{
          label: 'BINARY ODD EVEN DISTRIBUTION',
          data: [0, 0],
          backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: {
            beginAtZero: true,
            //max: 100,
            ticks: {
              callback: function(value) {
                return value + '%'; // corrected from `${value  }%`
              }
            }
          }
        }
      }
    });
  
    // Set interval to fetch data and update the chart every 5 seconds
    setInterval(fetchDataAndUpdateChart, 1000);
  });
  
  $(document).on('click', '#changeTicks', function() {
    updateTicknMarket();
  });
  
  function updateTicknMarket() {
    const formData = {
      symbol: $('#symbol').val(),
      count: $('#count').val(),
    };
  
    $.ajax({
      url: 'http://localhost:3000/ticks',
      type: 'POST',
      data: formData,
      dataType: 'json',
      success: function(data) {
        $('#marketAlert').html(data);
      },
      error: function(error) {
        console.error(error);
      }
    });
  }
  