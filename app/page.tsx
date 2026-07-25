import { ChargeMap } from "@/components/charge-map";
import { headers } from "next/headers";

export default async function Home() {
  const heads = await headers();
  const latStr = heads.get("x-vercel-ip-latitude");
  const lngStr = heads.get("x-vercel-ip-longitude");
  
  const initialLoc = latStr && lngStr ? {
    lat: parseFloat(latStr),
    lng: parseFloat(lngStr)
  } : null;

  return <ChargeMap initialLoc={initialLoc} />;
}
