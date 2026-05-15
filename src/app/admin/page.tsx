import { isAuthed } from "@/lib/auth";
import {
  listThemesWithSources,
  listDocuments,
  getSiteString,
} from "@/lib/repo";
import {
  SITE_INTRODUCTION_KEY,
  SITE_CLOSING_COMMENTARY_KEY,
  SITE_BACKGROUND_IMAGE_KEY,
} from "@/lib/site-copy";
import { LoginForm } from "@/components/admin/LoginForm";
import { ThemesEditor } from "@/components/admin/ThemesEditor";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAuthed())) {
    return <LoginForm />;
  }
  const [themes, documents, introductionBody, backgroundImageUrl, closingCommentaryBody] =
    await Promise.all([
      listThemesWithSources(),
      listDocuments({ onlyVisible: false }),
      getSiteString(SITE_INTRODUCTION_KEY),
      getSiteString(SITE_BACKGROUND_IMAGE_KEY),
      getSiteString(SITE_CLOSING_COMMENTARY_KEY),
    ]);
  return (
    <ThemesEditor
      themes={themes}
      documents={documents}
      introductionBody={introductionBody}
      closingCommentaryBody={closingCommentaryBody}
      backgroundImageUrl={backgroundImageUrl}
    />
  );
}
