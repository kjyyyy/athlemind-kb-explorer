import { proxyTypeahead } from "@/lib/typeahead-proxy";

export async function GET(req: Request) {
  return proxyTypeahead(req, "/v1/works/search");
}
