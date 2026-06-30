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
            pointRadius: 12,
            pointBackgroundColor: "rgba(0, 0, 0, 0)",
            pointBorderColor: "rgba(0, 0, 0, 0)",
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            grid: {
              color: "#2e2e2e",
            },
            ticks: {
              callback: function (value: string | number) {
                return Number(value).toFixed(4);
              },
              maxTicksLimit: 3,
              padding: 16,
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: false,
              callback: function (val, index) {
                const label = this.getLabelForValue(Number(val));
                const dateObj = new Date(label);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                const totalItems = this.getLabels().length;

                const indices = [];
                let current = totalItems - 1;

                const step =
                  totalItems < 29
                    ? 1
                    : totalItems < 85
                      ? 8
                      : totalItems < 365
                        ? 15
                        : totalItems < 500
                          ? 31
                          : 121;
                while (current >= 0) {
                  indices.push(current);
                  current -= step;
                }

                if (indices[indices.length - 1] !== 0) {
                  indices.push(0);
                }

                return indices.includes(index) ? formattedDate : "";
              },
              minRotation: 0,
              maxRotation: 0,
              padding: 16,
            },
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
