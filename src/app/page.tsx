import { Suspense } from "react";
import { listDocuments, listThemesWithSources, getSiteString } from "@/lib/repo";
import {
  SITE_INTRODUCTION_KEY,
  SITE_CLOSING_COMMENTARY_KEY,
  SITE_BACKGROUND_IMAGE_KEY,
} from "@/lib/site-copy";
import { loadSeedAsDemoData } from "@/lib/demo";
import { Background } from "@/components/Background";
import { MainExperience } from "@/components/MainExperience";
import { SiteAmbientMusic } from "@/components/SiteAmbientMusic";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let introduction = "";
  let closingCommentary = "";
  let backgroundImageUrl = "";
  let documents = [] as Awaited<ReturnType<typeof listDocuments>>;
  let themes = [] as Awaited<ReturnType<typeof listThemesWithSources>>;
  let dbError: string | null = null;
  let demoMode = false;
  try {
    [documents, themes, introduction, backgroundImageUrl, closingCommentary] =
      await Promise.all([
        listDocuments({ onlyVisible: true }),
        listThemesWithSources(),
        getSiteString(SITE_INTRODUCTION_KEY),
        getSiteString(SITE_BACKGROUND_IMAGE_KEY),
        getSiteString(SITE_CLOSING_COMMENTARY_KEY),
      ]);
  } catch (e) {
    dbError = (e as Error).message;
    // Fall back to the seed JSON file (if it exists) so the site is still
    // browsable in demo mode. Themes/reflections won't work without a DB.
    const seed = await loadSeedAsDemoData();
    if (seed) {
      documents = seed.documents;
      themes = [];
      demoMode = true;
      dbError = null;
    }
  }

  return (
    <main className="isolate relative h-screen w-screen overflow-hidden">
      <Background
        src={
          backgroundImageUrl.trim()
            ? "/api/site/background-image"
            : undefined
        }
      />
      <SiteAmbientMusic />
      <Suspense>
        <MainExperience
          documents={documents}
          themes={themes}
          introduction={introduction}
          closingCommentary={closingCommentary}
          dbError={dbError}
          demoMode={demoMode}
        />
      </Suspense>
    </main>
  );
}
