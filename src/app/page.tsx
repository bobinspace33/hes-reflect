import { Suspense } from "react";
import { listDocuments, listThemesWithSources } from "@/lib/repo";
import { loadSeedAsDemoData } from "@/lib/demo";
import { Background } from "@/components/Background";
import { MainExperience } from "@/components/MainExperience";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let documents = [] as Awaited<ReturnType<typeof listDocuments>>;
  let themes = [] as Awaited<ReturnType<typeof listThemesWithSources>>;
  let dbError: string | null = null;
  let demoMode = false;
  try {
    [documents, themes] = await Promise.all([
      listDocuments({ onlyVisible: true }),
      listThemesWithSources(),
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
      <Background />
      <Suspense>
        <MainExperience
          documents={documents}
          themes={themes}
          dbError={dbError}
          demoMode={demoMode}
        />
      </Suspense>
    </main>
  );
}
