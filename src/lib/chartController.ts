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

  addData(label: string, newData: number): void {
    this.chart.data.labels?.push(label);
    this.chart.data.datasets.forEach((dataset) => {
      dataset.data.push(newData);
    });
    this.chart.update();
  }

  removeData(): void {
    this.chart.data.labels = [];
    this.chart.data.datasets.forEach((dataset) => {
      dataset.data = [];
    });
    this.chart.update();
  }
}
