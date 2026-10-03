"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Play, ArrowRight, Braces, Box, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type QueryField = "id" | "name" | "email" | "posts";
type PostField = "title" | "views";

export default function GraphQLPlayground() {
  const [selectedUserFields, setSelectedUserFields] = useState<QueryField[]>([
    "name",
  ]);
  const [selectedPostFields, setSelectedPostFields] = useState<PostField[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Track mount status so the async query can bail out after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const toggleUserField = (field: QueryField) => {
    setSelectedUserFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const togglePostField = (field: PostField) => {
    setSelectedPostFields((prev) => {
      const newFields = prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field];
      // Auto-select 'posts' in parent if subfields are selected
      if (newFields.length > 0 && !selectedUserFields.includes("posts")) {
        setSelectedUserFields((curr) => [...curr, "posts"]);
      }
      return newFields;
    });
  };

  const runQuery = async () => {
    setIsLoading(true);
    setResult(null);

    // Simulate resolver latency
    await new Promise((r) => setTimeout(r, 800));
    if (!isMountedRef.current) return;

    const mockData = {
      data: {
        user: {
          ...(selectedUserFields.includes("id") && { id: "u_123" }),
          ...(selectedUserFields.includes("name") && { name: "Alice Dev" }),
          ...(selectedUserFields.includes("email") && {
            email: "alice@example.com",
          }),
          ...(selectedUserFields.includes("posts") && {
            posts: [
              {
                ...(selectedPostFields.includes("title") && {
                  title: "GraphQL 101",
                }),
                ...(selectedPostFields.includes("views") && { views: 42 }),
              },
              {
                ...(selectedPostFields.includes("title") && {
                  title: "System Design",
                }),
                ...(selectedPostFields.includes("views") && { views: 99 }),
              },
            ],
          }),
        },
      },
    };

    setResult(JSON.stringify(mockData, null, 2));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-sm">
      <Card className="p-6 border-2 border-pink-500/20 bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Box className="h-5 w-5 text-pink-500" />
                GraphQL Playground
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ask for exactly what you need. No over-fetching.
              </p>
            </div>
            <Button
              onClick={runQuery}
              disabled={isLoading}
              size="sm"
              className="bg-pink-600 hover:bg-pink-700 text-xs gap-1"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3 fill-current" />
              )}
              Run Query
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Query Builder */}
            <div className="border rounded-lg p-3 bg-slate-900/50 font-mono text-xs">
              <div className="text-pink-400 mb-2">query GetUser {"{"}</div>
              <div className="pl-4 text-blue-400">user(id: "1") {"{"}</div>

              {/* User Fields */}
              <div className="pl-8 flex flex-col gap-1">
                {["id", "name", "email"].map((f) => (
                  <label
                    key={f}
                    className="flex items-center gap-2 cursor-pointer hover:bg-black dark:hover:bg-white/5 rounded px-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserFields.includes(f as QueryField)}
                      onChange={() => toggleUserField(f as QueryField)}
                      className="accent-pink-500"
                    />
                    <span
                      className={
                        selectedUserFields.includes(f as QueryField)
                          ? "text-slate-200"
                          : "text-slate-500"
                      }
                    >
                      {f}
                    </span>
                  </label>
                ))}

                {/* Posts Relation */}
                <label className="flex items-center gap-2 cursor-pointer hover:bg-black dark:hover:bg-white/5 rounded px-1 mt-1">
                  <input
                    type="checkbox"
                    checked={selectedUserFields.includes("posts")}
                    onChange={() => toggleUserField("posts")}
                    className="accent-pink-500"
                  />
                  <span
                    className={
                      selectedUserFields.includes("posts")
                        ? "text-slate-200"
                        : "text-slate-500"
                    }
                  >
                    posts {"{"}
                  </span>
                </label>

                {/* Post Subfields */}
                {selectedUserFields.includes("posts") && (
                  <div className="pl-4 flex flex-col gap-1 border-l border-slate-700 ml-1">
                    {["title", "views"].map((f) => (
                      <label
                        key={f}
                        className="flex items-center gap-2 cursor-pointer hover:bg-black dark:hover:bg-white/5 rounded px-1"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPostFields.includes(f as PostField)}
                          onChange={() => togglePostField(f as PostField)}
                          className="accent-pink-500"
                        />
                        <span
                          className={
                            selectedPostFields.includes(f as PostField)
                              ? "text-slate-200"
                              : "text-slate-500"
                          }
                        >
                          {f}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedUserFields.includes("posts") && (
                  <div className="text-slate-500">{"}"}</div>
                )}
              </div>

              <div className="pl-4 text-blue-400">{"}"}</div>
              <div className="text-pink-400">{"}"}</div>
            </div>

            {/* Result JSON */}
            <div className="border rounded-lg p-3 bg-slate-950 font-mono text-xs overflow-auto h-[250px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-pink-500 animate-pulse">
                  Resolving Graph...
                </div>
              ) : result ? (
                <pre className="text-green-400">{result}</pre>
              ) : (
                <div className="text-slate-600 italic mt-10 text-center">
                  Construct query and press Run
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground border-t pt-2 max-w-lg">
            Notice how the server returns <strong>only</strong> the requested
            fields. This solves the "Over-fetching" problem common in REST.
          </div>
        </div>
      </Card>
    </div>
  );
}
