import { ConsumptionMethod } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ConsumptionMethodOptionProps {
  slug: string;
  imageUrl: string;
  imageAlt: string;
  buttonText: string;
  option: ConsumptionMethod;
  mesa?: string;
}

const ConsumptionMethodOption = ({
  slug,
  imageAlt,
  imageUrl,
  buttonText,
  option,
  mesa,
}: ConsumptionMethodOptionProps) => {
  const href = `/${slug}/menu?consumptionMethod=${option}${mesa ? `&mesa=${encodeURIComponent(mesa)}` : ""}`;
  return (
    <Card className="hover:border-primary transition-all">
      <CardContent className="flex flex-col items-center gap-8 py-8">
        <div className="relative h-[80px] w-[80px]">
          <Image
            src={imageUrl}
            fill
            alt={imageAlt}
            className="object-contain"
          />
        </div>
        <Button variant="secondary" className="rounded-full font-medium" asChild>
          <Link href={href}>
            {buttonText}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConsumptionMethodOption;