with open("apps/studio/components/needs-review-queue.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "async function fetchStatusesBatched(\n  statuses: ArticleStatus[],",
    "async function fetchStatusesBatched(\n  statuses: readonly ArticleStatus[],"
)

with open("apps/studio/components/needs-review-queue.tsx", "w") as f:
    f.write(content)
