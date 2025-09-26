"use client"
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import Image from "next/image";
export default function Home() {

  return (
    <div>
      <Button  variant={"outline"}>
        你好
      </Button>
      <AspectRatio ratio={16 / 9}>
        <Image
          className="rounded-md object-cover"
          src={
            "https://i0.hdslb.com/bfs/banner/108bcf0280e0e531364a47f92b5c20c05022b2b8.png@800w_512h_!web-home-carousel-cover.avif"
          }
          alt={"logo"}
          height={500}
          width={500}
        />
      
      </AspectRatio>
    </div>
  );
}
