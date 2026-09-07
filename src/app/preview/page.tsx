import { notFound } from "next/navigation";
import Preview from "./preview-client";
export const dynamic = "force-dynamic";
export default function Page() {
  if(process.env.LOCAL_PREVIEW!=="true")notFound();
  return <Preview/>;
}
