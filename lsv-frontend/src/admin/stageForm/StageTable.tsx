import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Pagination,
} from "flowbite-react";
import { HiPencil, HiTrash } from "react-icons/hi";
import type { Stage } from "./types";

interface StageTableProps {
  stages: Stage[];
  orderBy: string;
  sortOrder: "ASC" | "DESC";
  currentPage: number;
  pageSize: number;
  totalStages: number;
  onSortChange: (orderBy: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
}

export default function StageTable({
  stages,
  orderBy,
  sortOrder,
  currentPage,
  pageSize,
  totalStages,
  onSortChange,
  onPageChange,
  onEdit,
  onDelete,
}: StageTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => onSortChange("name")}
            >
              <div className="flex items-center gap-2">
                Nivel
                {orderBy === "name" && (
                  <span className="text-blue-600">
                    {sortOrder === "ASC" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </TableHeadCell>
            <TableHeadCell
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => onSortChange("description")}
            >
              <div className="flex items-center gap-2">
                Descripción
                {orderBy === "description" && (
                  <span className="text-blue-600">
                    {sortOrder === "ASC" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </TableHeadCell>
            <TableHeadCell>
              <span className="sr-only">Acciones</span>
            </TableHeadCell>
          </TableHead>
          <TableBody className="divide-y">
            {stages.map((stage) => (
              <TableRow
                key={stage.id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {stage.name}
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">
                  {stage.description}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      color="light"
                      onClick={() => onEdit(stage)}
                    >
                      <div className="flex items-center">
                        <HiPencil className="mr-1 size-4" />
                        Editar
                      </div>
                    </Button>
                    <Button
                      size="sm"
                      color="failure"
                      onClick={() => onDelete(stage)}
                    >
                      <div className="flex items-center">
                        <HiTrash className="mr-1 size-4" />
                        Eliminar
                      </div>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalStages > pageSize && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex overflow-x-auto sm:justify-center">
            <Pagination
              layout="pagination"
              currentPage={currentPage}
              totalPages={Math.ceil(totalStages / pageSize)}
              onPageChange={onPageChange}
              previousLabel="Anterior"
              nextLabel="Siguiente"
              showIcons
            />
          </div>
        </div>
      )}
    </div>
  );
}
