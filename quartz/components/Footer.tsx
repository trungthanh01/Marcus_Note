import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

export default (() => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <footer class={`${displayClass ?? ""}`}>
        <ul class="footer-contacts">
          <li>
            <a href="https://www.linkedin.com/in/trung-thanh-le-8460bb35b/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <i class="fa-brands fa-linkedin"></i>
            </a>
          </li>
          <li>
            <a href="https://x.com/marcusleovn" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
              <i class="fa-brands fa-x-twitter"></i>
            </a>
          </li>
          <li>
            <a href="https://www.threads.com/@trungthanh.marcus?hl=vi" target="_blank" rel="noopener noreferrer" aria-label="Threads">
              <i class="fa-brands fa-threads"></i>
            </a>
          </li>
          <li>
            <a href="mailto:trungthanh.marcus@gmail.com" aria-label="Gmail">
              <i class="fa-solid fa-envelope"></i>
            </a>
          </li>
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
