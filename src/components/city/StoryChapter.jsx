export function StoryChapter({ index, kicker, title, children, className = '' }) {
  return (
    <article data-chapter={index} className={`chapter chapter-${index} ${className}`}>
      <div className="chapter-body">
        <p className="kicker">{kicker}</p>
        {title && <h2 className="chapter-title">{title}</h2>}
        {children}
      </div>
    </article>
  )
}
