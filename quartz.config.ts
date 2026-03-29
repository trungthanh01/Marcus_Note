import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Marcus's Notes",
    pageTitleSuffix: " — Marcus's Notes",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "vi-VN",
    baseUrl: "trungthanh01.github.io/Marcus_Note",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Lora",
        body: "Lora",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#e8dece",
          lightgray: "#cec6b4",
          gray: "#a09080",
          darkgray: "#4a4038",
          dark: "#1a1410",
          secondary: "#3a2e28",
          tertiary: "#7a6e68",
          highlight: "rgba(160, 152, 136, 0.15)",
          textHighlight: "rgba(160, 152, 136, 0.35)",
        },
        darkMode: {
          light: "#1c1a18",
          lightgray: "#2e2c28",
          gray: "#605850",
          darkgray: "#c8c0b0",
          dark: "#e8e0d0",
          secondary: "#b0a898",
          tertiary: "#908880",
          highlight: "rgba(80, 72, 64, 0.3)",
          textHighlight: "rgba(200, 192, 160, 0.3)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
