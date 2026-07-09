import { Badge } from "@/components/ui/badge";

type ProductBadgesProps = {
  isNew?: boolean;
  isSale?: boolean;
};

export function ProductBadges({ isNew, isSale }: ProductBadgesProps) {
  if (!isNew && !isSale) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isNew ? <Badge className="border-teal-200 bg-teal-50 text-teal-800">New</Badge> : null}
      {isSale ? <Badge className="border-amber-200 bg-amber-50 text-amber-800">Sale</Badge> : null}
    </div>
  );
}
