"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

interface Document {
  id: string;
  title: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);

  const [loading, setLoading] = useState(true);

  const [joinDocId, setJoinDocId] = useState("");

  // =========================================================
  // 🔥 FETCH DOCUMENTS
  // =========================================================

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/v1/document/recent",
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        setDocuments(data.documents || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // =========================================================
  // 🔥 CREATE DOCUMENT
  // =========================================================

  const handleCreateDocument = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/document/create",
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      router.push(`/doc/${data.document.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleJoinDocument = () => {
    if (!joinDocId.trim()) return;

    router.push(`/doc/${joinDocId}`);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* 🔥 HEADER */}

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>

            <p className="text-zinc-400 mt-2">
              Manage your collaborative documents.
            </p>
          </div>

          <button
            onClick={handleCreateDocument}
            className="bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-3 rounded-xl font-medium"
          >
            + New Document
          </button>
        </div>

        <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Join Existing Document</h2>

          <div className="flex gap-3">
            <input
              value={joinDocId}
              onChange={(e) => setJoinDocId(e.target.value)}
              placeholder="Enter document ID..."
              className="
        flex-1
        bg-[#0d1117]
        border
        border-zinc-700
        rounded-xl
        px-4
        py-3
        outline-none
        focus:border-blue-500
      "
            />

            <button
              onClick={handleJoinDocument}
              className="
        bg-blue-600
        hover:bg-blue-700
        transition-colors
        px-5
        rounded-xl
        font-medium
      "
            >
              Join
            </button>
          </div>
        </div>

        {/* 🔥 LOADING */}

        {loading && <div className="text-zinc-400">Loading documents...</div>}

        {/* 🔥 EMPTY STATE */}

        {!loading && documents.length === 0 && (
          <div className="bg-[#161b22] border border-zinc-800 rounded-2xl p-10 text-center">
            <h3 className="text-xl font-semibold mb-3">No documents yet</h3>

            <p className="text-zinc-400 mb-6">
              Create your first collaborative document 🚀
            </p>

            <button
              onClick={handleCreateDocument}
              className="bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-3 rounded-xl font-medium"
            >
              Create Document
            </button>
          </div>
        )}

        {/* 🔥 DOCUMENTS */}

        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/doc/${doc.id}`)}
              className="bg-[#161b22] border border-zinc-800 rounded-2xl p-6 hover:border-blue-500 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{doc.title}</h3>

                  <p className="text-zinc-400 text-sm mt-2">ID: {doc.id}</p>
                </div>

                <div className="text-sm text-zinc-400">
                  {new Date(doc.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
