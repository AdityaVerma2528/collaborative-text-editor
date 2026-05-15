"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/lib/socket";

export default function DocPage() {
  const params = useParams();

  const docId = params?.id as string;

  const userRef = useRef({
    name:
      "User-" +
      Math.floor(Math.random() * 1000),

    color: `hsl(${
      Math.random() * 360
    }, 70%, 50%)`,
  });

  // =========================================================
  // 🔥 STATES
  // =========================================================

  const [title, setTitle] =
    useState("Untitled Document");

  const [content, setContent] =
    useState("");

  const [saveStatus, setSaveStatus] =
    useState("Saved");

  const [cursors, setCursors] =
    useState<
      Record<
        string,
        {
          x: number;
          y: number;
          name: string;
          color: string;
        }
      >
    >({});

  // =========================================================
  // 🔥 REFS
  // =========================================================

  const updateTimeoutRef =
    useRef<NodeJS.Timeout | null>(null);

  const saveTimeoutRef =
    useRef<NodeJS.Timeout | null>(null);

  const titleTimeoutRef =
    useRef<NodeJS.Timeout | null>(null);

  const lastSentRef = useRef(0);

  // =========================================================
  // 🔥 LOADING
  // =========================================================

  if (!docId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading document...
      </div>
    );
  }

  // =========================================================
  // 🔌 CONNECT SOCKET
  // =========================================================

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  // =========================================================
  // 📄 JOIN DOCUMENT
  // =========================================================

  useEffect(() => {
    socket.emit("join-doc", docId);

    // 🔥 Initial data
    const handleInit = (data: {
      title: string;
      content: string;
    }) => {
      setTitle(data.title);
      setContent(data.content);
    };

    // 🔥 Realtime content update
    const handleUpdate = (
      updatedContent: string
    ) => {
      setContent(updatedContent);
    };

    // 🔥 Realtime title update
    const handleTitleUpdate = (
      updatedTitle: string
    ) => {
      setTitle(updatedTitle);
    };

    socket.on("init", handleInit);

    socket.on(
      "receive-update",
      handleUpdate
    );

    socket.on(
      "receive-title-update",
      handleTitleUpdate
    );

    return () => {
      socket.off("init", handleInit);

      socket.off(
        "receive-update",
        handleUpdate
      );

      socket.off(
        "receive-title-update",
        handleTitleUpdate
      );
    };
  }, [docId]);

  // =========================================================
  // 🖱️ CURSOR LISTENER
  // =========================================================

  useEffect(() => {
    const handleCursorUpdate = ({
      socketId,
      cursor,
      user,
    }: {
      socketId: string;
      cursor: {
        x: number;
        y: number;
      };
      user: {
        name: string;
        color: string;
      };
    }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: {
          ...cursor,
          name: user.name,
          color: user.color,
        },
      }));
    };

    socket.on(
      "cursor-update",
      handleCursorUpdate
    );

    return () => {
      socket.off(
        "cursor-update",
        handleCursorUpdate
      );
    };
  }, []);

  // =========================================================
  // ✍️ HANDLE CONTENT CHANGE
  // =========================================================

  const handleChange = (
    value: string
  ) => {
    setContent(value);

    setSaveStatus("Saving...");

    // 🔥 Realtime update
    if (updateTimeoutRef.current) {
      clearTimeout(
        updateTimeoutRef.current
      );
    }

    updateTimeoutRef.current =
      setTimeout(() => {
        socket.emit("update-doc", {
          docId,
          content: value,
        });
      }, 100);

    // 🔥 Database save
    if (saveTimeoutRef.current) {
      clearTimeout(
        saveTimeoutRef.current
      );
    }

    saveTimeoutRef.current =
      setTimeout(() => {
        socket.emit("save-doc", {
          docId,
          content: value,
        });

        setSaveStatus("Saved");
      }, 2000);
  };

  // =========================================================
  // 📝 HANDLE TITLE CHANGE
  // =========================================================

  const handleTitleChange = (
    value: string
  ) => {
    setTitle(value);

    if (titleTimeoutRef.current) {
      clearTimeout(
        titleTimeoutRef.current
      );
    }

    titleTimeoutRef.current =
      setTimeout(() => {
        socket.emit("update-title", {
          docId,
          title: value,
        });
      }, 500);
  };

  // =========================================================
  // 🖱️ HANDLE CURSOR MOVE
  // =========================================================

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const now = Date.now();

    if (
      now - lastSentRef.current <
      50
    )
      return;

    lastSentRef.current = now;

    const rect =
      e.currentTarget.getBoundingClientRect();

    const cursor = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    socket.emit("cursor-move", {
      docId,
      cursor,
      user: userRef.current,
    });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* 🔥 NAVBAR */}

      <div className="border-b border-zinc-800 bg-[#161b22] px-6 py-4 flex items-center justify-between">

        <div className="flex flex-col gap-1">

          {/* 🔥 TITLE */}

          <input
            value={title}
            onChange={(e) =>
              handleTitleChange(
                e.target.value
              )
            }
            placeholder="Untitled Document"
            className="
              bg-transparent
              text-2xl
              font-semibold
              outline-none
              border-none
              text-white
            "
          />

          <p className="text-sm text-zinc-400">
            Document ID: {docId}
          </p>
        </div>

        {/* 🔥 RIGHT */}

        <div className="flex items-center gap-3">

          <div className="text-sm text-zinc-400">
            {saveStatus}
          </div>

          <div
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor:
                userRef.current.color,
            }}
          >
            {userRef.current.name}
          </div>
        </div>
      </div>

      {/* 🔥 EDITOR */}

      <div className="max-w-5xl mx-auto px-6 py-8">

        <div
          onMouseMove={
            handleMouseMove
          }
          className="relative"
        >

          <textarea
            value={content}
            onChange={(e) =>
              handleChange(
                e.target.value
              )
            }
            placeholder="Start typing here..."
            className="
              w-full
              min-h-[700px]
              bg-[#161b22]
              border
              border-zinc-800
              rounded-2xl
              p-6
              text-[16px]
              leading-7
              outline-none
              resize-none
              shadow-2xl
              focus:border-blue-500
              transition-colors
            "
          />

          {/* 🔥 CURSORS */}

          {Object.entries(cursors).map(
            ([id, pos]) => {

              if (id === socket.id)
                return null;

              return (
                <div
                  key={id}
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: pos.x,
                    top: pos.y,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        pos.color,
                    }}
                  />

                  <div
                    className="text-xs text-white px-2 py-1 rounded-md mt-1 whitespace-nowrap shadow-lg"
                    style={{
                      backgroundColor:
                        pos.color,
                    }}
                  >
                    {pos.name}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}