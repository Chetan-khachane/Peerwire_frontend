"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner"


export default function Page() {
  const [enter, setEnter] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    try{
      const res = await fetch("http://127.0.0.1:8080/ping")
      
        toast.success("Client Connected")
      
      setEnter(true);
      setTimeout(() => {
        router.push("/dashboard"); 
      }, 900);
    }catch(e){
        toast.error("Client not connected")
    }
  };

  return (
    <motion.div
      initial={{ scale: 1, opacity: 1 }}
      animate={{
  scale: enter ? 12 : 1,
  opacity: enter ? 0 : 1,
  filter: enter ? "brightness(1.8)" : "brightness(1)",
  rotateZ: enter ? 2 : 0,
}}

      transition={{
        duration: 0.9,
        ease: "easeInOut",
      }}
      className="fixed inset-0 bg-[#3b3b3b] flex flex-col items-center justify-center shadow-none border-none outline-none overflow-hidden"
    >
      {!enter && (
        <h1
          className="mb-6 text-3xl tracking-widest font-semibold text-[#B6FF9C]
                     drop-shadow-[0_0_12px_rgba(120,255,120,0.35)]"
        >
          PEERWIRE
        </h1>
      )}
    
      <div className="relative w-175 h-125">
        <Image
          src="/home.jpg"
          alt="cube"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

     
      {!enter && (
        <Button
          className="
             px-12 py-5
             cursor-pointer
            rounded-md
            text-sm tracking-wider uppercase
            text-[#B6FF9C]
            bg-[#1F1F1D]
            border border-[#3A3A36]
            transition-all duration-300 ease-out

            hover:border-[#7CFF7C]
            hover:shadow-[0_0_18px_rgba(120,255,120,0.45)]
            hover:bg-[#232321]

            active:scale-95
          "
          onClick={handleContinue}
        >
          Continue
        </Button>
      )}
    </motion.div>
  );
}
