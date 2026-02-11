"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import DownloadCard from "@/components/dashboard/DownloadCard";
import {toast} from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type jobLog = {
  message : string;
  code : number;
}

type JobStat = {
  jobId: string;
  downloaded: number;
  total: number;
  speed: number;
  activePeers: number;
  completed: boolean;
  name: string;
  foundPeers: boolean;
  log : jobLog;
};

type Download = {
  id: string;
  name: string;
  downloaded: number;
  total: number;
  speed: number;
  activePeers: number;
  completed: boolean;
  foundPeers: boolean;
};

export default function Page() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<Map<string ,JobStat >>(new Map());

  const itemsPerPage = 3;

  
  useEffect(() => {
    console.log("Connecting to status stream...");

    const es = new EventSource("http://127.0.0.1:8080/status-stream");

  es.onmessage = (event) => {
  const payload: JobStat[] = JSON.parse(event.data);

  setStatus(prev => {
    // quick size check
    if (prev.size !== payload.length) {
      const next = new Map<string, JobStat>();
      payload.forEach(j => next.set(j.jobId, j));
      return next;
    }

    // shallow compare existing jobs
    for (const job of payload) {
      const existing = prev.get(job.jobId);
      if (
        !existing ||
        existing.downloaded !== job.downloaded ||
        existing.speed !== job.speed ||
        existing.activePeers !== job.activePeers ||
        existing.completed !== job.completed ||
        existing.foundPeers !== job.foundPeers ||
        existing.log?.message !== job.log?.message ||
        existing.log?.code !== job.log?.code
      ) {
        const next = new Map<string, JobStat>();
        payload.forEach(j => next.set(j.jobId, j));
        return next;
      }
    }

    // nothing changed → NO re-render
    return prev;
  });

};


    es.onerror = (err) => {
      console.error("SSE error:", err);
      toast.error("Client Disconneted")
      es.close();
    };

    return () => {
      console.log("Closing status stream");
      es.close();
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("downloadList");
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setDownloads(parsed);
      }
    } catch (err) {
      toast.error("Invalid Local Storage data")
      console.error("Invalid localStorage data", err);
    }
  }, [status]);

  useEffect(() => {
    if (downloads.length > 0) {
      localStorage.setItem("downloadList", JSON.stringify(downloads));
    } else {
      localStorage.removeItem("downloadList");
  }
  }, [downloads]);

  function handleDeleteDownload(id: string) {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }

  function handleNewDownload() {
 
    const downloadData = {
       id: crypto.randomUUID(),
       downloaded: 0,
       total: 0,
       speed: 0,
       activePeers: 0,
       completed: false,
       name: "",
       foundPeers: true
    }
    setDownloads((prev) => [downloadData, ...prev]);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(downloads.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const visibleDownloads = downloads.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col items-center min-h-screen">
      <h1
        className="text-5xl tracking-widest font-semibold text-[#44ff00]
        drop-shadow-[0_0_12px_rgba(120,255,120,0.35)] text-center mt-3"
      >
        PEERWIRE
      </h1>

      

      <Button
        onClick={handleNewDownload}
        className=" rounded-full w-14 h-14 shadow-2xl mt-5"
      >
        <PlusIcon />
      </Button>

      <ul className="mt-2 space-y-2">
        {visibleDownloads.map((download, idx) => {
          return (
            <DownloadCard
              key={download.id}
              job={download}
              stats={status.get(download.id)}
              onDelete={handleDeleteDownload}
            />
          );
        })}
      </ul>

      {totalPages > 1 && (
        <Pagination className="mt-3">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
