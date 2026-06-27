import { Chart } from "chart.js/auto";

export class ChartController {
  chart: Chart;

  constructor(ctx: HTMLCanvasElement) {
    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  //   const addData = (chart: Chart, label: string, newData: number) => {
  //     chart.data.labels?.push(label);
  //     chart.data.datasets.forEach((dataset) => {
  //       dataset.data.push(newData);
  //     });
  //     chart.update();
  //   };

  //   const removeData = (chart: Chart) => {
  //     chart.data.labels?.pop();
  //     chart.data.datasets.forEach((dataset) => {
  //       dataset.data.pop();
  //     });
  //     chart.update("none");
  //   };
}
