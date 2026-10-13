/* ------------------------------------------------------------------ */
/*  Email primitives. A template is a pure function that turns typed    */
/*  data into { subject, html, text }. Nothing here touches the network */
/*  or the DB, so templates stay trivially testable.                    */
/* ------------------------------------------------------------------ */

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

/** A rendered email plus its recipient — what actually gets sent/queued. */
export interface EmailMessage extends RenderedEmail {
  to: string
}
