import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

import { getSecurityScoreTone } from "../model/security-models"
import { type SecurityScore } from "../types/security-types"

const chartConfig = {
  score: {
    label: "Pontuação",
  },
} satisfies ChartConfig

const scoreColorByTone = {
  error: "var(--error)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
} as const

export function SecurityScoreChart({ score }: { score: SecurityScore }) {
  const tone = getSecurityScoreTone(score)
  const chartData = [{ score: score.value, fill: scoreColorByTone[tone] }]

  return (
    <div
      role="progressbar"
      aria-label={`Pontuação de segurança: ${score.value} de 100`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score.value}
      data-score-tone={tone}
      className="size-24 shrink-0"
    >
      <ChartContainer
        config={chartConfig}
        className="aspect-square size-full"
      >
        <RadialBarChart
          data={chartData}
          startAngle={90}
          endAngle={-270}
          innerRadius={36}
          outerRadius={44}
        >
          <PolarAngleAxis
            type="number"
            dataKey="score"
            domain={[0, 100]}
            tick={false}
          />
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={[44, 36]}
          />
          <RadialBar
            dataKey="score"
            fill={scoreColorByTone[tone]}
            background={{ fill: "var(--muted)" }}
            cornerRadius={8}
            isAnimationActive={false}
          />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                  return null
                }

                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 5}
                      className="fill-foreground text-lg font-semibold"
                    >
                      {score.value}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 14}
                      className="fill-muted-foreground text-[0.625rem]"
                    >
                      / 100
                    </tspan>
                  </text>
                )
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
    </div>
  )
}
