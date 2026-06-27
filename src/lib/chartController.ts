import { Chart, Filler } from "chart.js/auto";
Chart.register(Filler);

export class ChartController {
  chart: Chart;

  constructor(ctx: HTMLCanvasElement) {
    let cty = ctx.getContext("2d")!;
    let gradient = cty.createLinearGradient(0, 0, 0, 400);

    gradient?.addColorStop(0, "rgba(206,247,57,100)");
    gradient?.addColorStop(1, "rgba(23, 23, 25, 0.00)");

    this.chart = new Chart(cty, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: gradient,
            borderWidth: 2,
            borderColor: "rgb(206,247,57)",
            fill: "start",
            pointRadius: 0,
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
    this.chart.update("none");
  }
}
