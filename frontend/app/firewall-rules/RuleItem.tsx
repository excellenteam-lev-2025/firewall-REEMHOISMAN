"use client";
import React from "react";
import type { Rule } from "@/api";

type Props = {
    rule: Rule;
    onToggleAction: (id: number) => void;
    onDeleteAction: (id: number) => void;
};

const RuleItem: React.FC<Props> = ({ rule, onToggleAction, onDeleteAction }) => {
    return (
        <li className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm">
            <div>
                <span className="font-medium text-zinc-950">{rule.value}</span>{" "}
                <span className="text-sm text-zinc-600">({rule.type}, {rule.mode})</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onToggleAction(rule.id)}
                    className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                        rule.active 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}>
                    {rule.active ? "Active" : "Inactive"}
                </button>
                <button
                    onClick={() => onDeleteAction(rule.id)}
                    className="rounded-md px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 transition"
                >
                    Delete
                </button>
            </div>
        </li>
    );
};

export default RuleItem;
