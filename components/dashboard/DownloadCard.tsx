"use client";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Upload } from "lucide-react";
import { DownloadIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { PlayIcon } from "lucide-react";
import { PauseIcon } from "lucide-react";
import { X } from "lucide-react";
import { input } from "framer-motion/client";
import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "../ui/field";
import {toast} from "sonner"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { stat } from "fs";
import { log } from "console";



type jobLog = {
  message: string;
  code: number;
};

type JobStat = {
  jobId: string;
  downloaded: number;
  total: number;
  speed: number;
  activePeers: number;
  completed: boolean;
  name: string;
  foundPeers: boolean;
  log: jobLog;
};

type StoredDownload = {
  id: string;
  name: string;
  downloaded: number;
  total: number;
  speed: number;
  activePeers: number;
  completed: boolean;
  foundPeers: boolean;
};



function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatSpeed(bytesPerSec: number) {
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 ** 2) return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
  return `${(bytesPerSec / 1024 ** 2).toFixed(2)} MB/s`;
}

export default function DownloadCard({
  job,
  onDelete,
  stats,
}: {
  job: StoredDownload;
  onDelete: (id: string) => void;
  stats?: JobStat;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("No file selected");
  const [isToDownload, setIsToDownload] = useState(job.completed);
  const logs = useRef<jobLog[]>([]);
  async function handleDownload() {
    // unique per torrent
    try{
          const res = await fetch("http://127.0.0.1:8080/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: job.id,
            torrentName: fileName,
          }),
        });

        setIsToDownload((p) => !p);
    }catch(e){
      toast.error("Error downloading : " + fileName) 
    }
 
  }
 

 useEffect(() => {
  if (!stats) return;

  const saved = localStorage.getItem("downloadList");
  const list: StoredDownload[] = saved ? JSON.parse(saved) : [];

  const idx = list.findIndex(d => d.id === job.id);

  const updated: StoredDownload = {
    id: job.id,
    name: job.name ? job.name : fileName,
    downloaded: stats.downloaded,
    total: stats.total,
    speed: stats.speed,
    activePeers: stats.activePeers,
    completed: stats.completed,
    foundPeers: stats.foundPeers,
  };

  if (idx !== -1) {
    list[idx] = updated;          // update existing
  } else {
    list.push(updated);           // first time
  }

  localStorage.setItem("downloadList", JSON.stringify(list));
}, [stats, job.id]);


  const speed = formatSpeed(stats ? stats.speed : job.speed);
  console.log(job.speed)
  const downloaded = formatBytes(stats ? stats.downloaded : job.downloaded);
  const total = formatBytes(stats ? stats.total : job.total);
  const code = stats ? stats.log.code : 0;
  const percentage = stats ? (stats.downloaded / stats.total) * 100 : (job.downloaded / job.total) * 100;
  const activePeers = stats ? stats.activePeers : 0;
  const message = stats ? stats.log.message : "";
  const name = stats ? stats.name : job.name;

 

  if(!message.includes(" : All peer threads finished. TorrentCLI exiting safely."))
    logs.current.push({code,message})

  return (
    <Card className="max-w-200 rounded-xs shadow-md m-3 py-2 px-3 w-170">
      <CardHeader className="mt-4 relative">
        <CardTitle className="absolute left-0">{job.name ? job.name : fileName}</CardTitle>
        <Button
          onClick={() => onDelete(job.id)}
          size={"sm"}
          variant={"outline"}
          className="w-20 text-red-600 text-sm font-bold 
                tracking-wide cursor-pointer hover:bg-red-600 hover:text-white ml-auto 
                "
        >
          Delete
        </Button>
      </CardHeader>

      {isToDownload && code != 1  ? (
        <div className="flex flex-col gap-2">
          <Field className="w-full max-w-xl">
            <FieldLabel htmlFor="progress-upload">
              <span>
                {speed}-{downloaded} / {total}
              </span>
              <span className="ml-auto">{percentage.toFixed(2)} %</span>
            </FieldLabel>
            <Progress value={percentage} id="progress-upload" />
          </Field>
          <Field>
            <span>Active Peers : {activePeers}</span>
          </Field>
          {(stats && stats.completed && stats.downloaded == stats.total) || job.completed ? (
            <Item className="">
              <ItemMedia variant="icon">
                <Check className="text-green-600" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-green-500">Completed</ItemTitle>
                <ItemDescription>
                  Check peerwire/downloads folder
                </ItemDescription>
              </ItemContent>
            </Item>
          )
          : code == 1 || job.completed ? (
            <Item className="">
              <ItemMedia variant="icon">
                <X className="text-red-600" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-red-500">Failed</ItemTitle>
                <ItemDescription>{message}</ItemDescription>
              </ItemContent>
            </Item>
          ) : (
            ""
          )}
        </div>
      ) : (
        <CardContent>
          <input
            ref={inputRef}
            type="file"
            accept=".torrent"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFileName(e.target.files[0].name);
              }
            }}
          />

          <div className="flex justify-between">
            <Button
              onClick={() => {
                inputRef.current?.click();
              }}
              className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition"
            >
              <Upload className="h-4 w-4" />
              Choose Torrent
            </Button>
            {fileName !== "No file selected" && (
              <Button
                onClick={handleDownload}
                variant={"outline"}
                className=" text-green-600 text-sm font-bold 
                tracking-wide cursor-pointer hover:bg-green-600 hover:text-white ml-auto 
                "
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
          <span className="truncate text-sm text-zinc-700 max-w-65">
            {fileName}
          </span>
        </CardContent>
      )}
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Logs</AccordionTrigger>
          <AccordionContent>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-2">
              {
                logs.current.length == 0 ?  <span className="text-xs text-muted-foreground">
                  No logs yet
                </span> 
                : (
                    logs.current.map((log,idx)=>
                         <div
                    key={idx}
                    className={`text-xs font-mono ${
                      log.code === 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {log.message}
                  </div>
                    )
                )
              }
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
