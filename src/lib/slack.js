export function buildSlackMessage(submissions) {
  const totalReviews = submissions.filter(s => s.type === 'Review').length
  const totalRefs = submissions.filter(s => s.type === 'Reference').length
  const totalStories = submissions.filter(s => s.type === 'Story').length

  return `📊 Customer Advocacy App — Snapshot
Week 1 of 6 • May 20, 2026

Team Progress
📝 Reviews: ${totalReviews}/50 (${Math.round(totalReviews/50*100)}%)
📋 References: ${totalRefs}/13 (${Math.round(totalRefs/13*100)}%)
📖 Stories: ${totalStories}/13 (${Math.round(totalStories/13*100)}%)

Ready to share! ✅`
}

export function buildConsolidatedSlackMessage(submissions) {
  return `📋 CSM Snapshot — Weekly Update
Week 1 of 6 • May 20, 2026

${submissions.length} total submissions recorded

Ready to share! ✅`
}
