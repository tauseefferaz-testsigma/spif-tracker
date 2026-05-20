export function buildConsolidatedSlackMessage(submissions) {
  const week = currentWeekNumber();

  // Build + sort leaderboard
  const stats = buildCsmStats(submissions)
    .map((csm) => ({
      ...csm,
      score:
        (csm.reviews * 3) +
        (csm.references * 5) +
        (csm.stories * 4),
    }))
    .sort((a, b) => b.score - a.score);

  const summary = buildTeamSummary(submissions);

  const medals = [
    ":first_place_medal:",
    ":second_place_medal:",
    ":third_place_medal:",
  ];

  let message = "";

  // Header
  message += `:sports_medal: *Customer Advocacy Leaderboard*\n`;
  message += `*Week ${week} of ${PROGRAM_WEEKS}*\n\n`;

  // Leaderboard
  stats.forEach((csm, index) => {
    const medal = medals[index] || ":small_blue_diamond:";

    message += `${medal} *${index + 1}. ${csm.name}*\n`;
    message += `   :memo: ${csm.reviews} Reviews`;
    message += `   |   :clipboard: ${csm.references} References`;
    message += `   |   :book: ${csm.stories} Stories`;
    message += `   |   :star: ${csm.score} pts\n\n`;
  });

  // Divider
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Team Target
  message += `:fire: *Team Target*\n`;
  message += `• Reviews → ${summary.targets.reviews}\n`;
  message += `• References → ${summary.targets.references}\n`;
  message += `• Stories → ${summary.targets.stories}\n\n`;

  // Current Totals
  message += `:bar_chart: *Current Totals*\n`;
  message += `• Reviews → ${summary.totalReviews}\n`;
  message += `• References → ${summary.totalRefs}\n`;
  message += `• Stories → ${summary.totalStories}\n\n`;

  // Progress Calculation
  const totalCompleted =
    summary.totalReviews +
    summary.totalRefs +
    summary.totalStories;

  const totalTarget =
    summary.targets.reviews +
    summary.targets.references +
    summary.targets.stories;

  const progress =
    Math.round((totalCompleted / totalTarget) * 100) || 0;

  // Progress Bar
  const filledBars = Math.round(progress / 10);
  const emptyBars = 10 - filledBars;

  const progressBar =
    "█".repeat(filledBars) +
    "░".repeat(emptyBars);

  message += `:dart: *Current Progress*\n`;
  message += `${progressBar} ${progress}% Complete\n\n`;

  // Status Indicator
  if (progress >= 75) {
    message += `:large_green_circle: Team is on track`;
  } else if (progress >= 40) {
    message += `:large_yellow_circle: Team is making progress`;
  } else {
    message += `:red_circle: Team needs momentum`;
  }

  return message;
}
