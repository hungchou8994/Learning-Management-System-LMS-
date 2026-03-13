"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/card";
import { Button } from "@/components/button";
import { Input } from "@/components/input";

export type CourseFilters = {
  priceRange: { min: number; max: number };
  onSale: boolean;
  teacherId?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  teachers: Array<{ id: string; name: string }>;
  onApplyFilters: (filters: CourseFilters) => void;
};

export function CourseFilters({
  isOpen,
  onClose,
  teachers,
  onApplyFilters,
}: Props) {
  const [filters, setFilters] = useState<CourseFilters>({
    priceRange: { min: 0, max: 1000 },
    onSale: false,
    teacherId: undefined,
  });

  if (!isOpen) return null;

  return (
    <Card className="absolute top-full mt-2 right-0 w-[280px] z-50 shadow-lg">
      <CardContent className="p-4 space-y-4">
        {/* Price Range */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-900">Price</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                className="h-8 text-xs"
                value={filters.priceRange.min}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priceRange: { ...filters.priceRange, min: +e.target.value },
                  })
                }
              />
              <span className="text-xs text-gray-500">to</span>
              <Input
                type="number"
                placeholder="Max"
                className="h-8 text-xs"
                value={filters.priceRange.max}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priceRange: { ...filters.priceRange, max: +e.target.value },
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onSale}
                onChange={(e) =>
                  setFilters({ ...filters, onSale: e.target.checked })
                }
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-700">
                Show only sale items
              </span>
            </label>
          </div>
        </div>

        {/* Teacher Filter */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-900">Teacher</h3>
          <select
            className="w-full h-8 text-xs rounded-lg border border-gray-300 bg-white"
            value={filters.teacherId}
            onChange={(e) =>
              setFilters({ ...filters, teacherId: e.target.value })
            }
          >
            <option value="">All Teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onClose}
          >
            Clear
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => {
              onApplyFilters(filters);
              onClose();
            }}
          >
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
