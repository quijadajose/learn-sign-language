import {
  Card,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Badge,
} from "flowbite-react";
import { HiPencil, HiTrash } from "react-icons/hi";
import { QuizVariant } from "./types";

interface QuizVariantTableProps {
  quizVariants: QuizVariant[];
  canEditVariant: (variant: QuizVariant) => boolean | "" | undefined;
  onEdit: (variant: QuizVariant) => void;
  onDelete: (id: string) => void;
}

export default function QuizVariantTable({
  quizVariants,
  canEditVariant,
  onEdit,
  onDelete,
}: QuizVariantTableProps) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableHeadCell>Variante de Lección</TableHeadCell>
            <TableHeadCell>Región</TableHeadCell>
            <TableHeadCell>Preguntas</TableHeadCell>
            <TableHeadCell>Acciones</TableHeadCell>
          </TableHead>
          <TableBody className="divide-y">
            {quizVariants.map((variant) => (
              <TableRow
                key={variant.id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {variant.lessonVariant?.name || "N/A"}
                </TableCell>
                <TableCell className="text-gray-900 dark:text-white">
                  <div className="flex items-center">
                    {variant.lessonVariant?.region?.name || "N/A"} (
                    {variant.lessonVariant?.region?.code || "N/A"})
                  </div>
                </TableCell>
                <TableCell className="text-gray-900 dark:text-white">
                  <Badge color="blue">
                    {variant.questionVariants.length} preguntas
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {canEditVariant(variant) && (
                      <>
                        <Button
                          size="sm"
                          color="info"
                          onClick={() => onEdit(variant)}
                        >
                          <HiPencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          color="failure"
                          onClick={() => onDelete(variant.id)}
                        >
                          <HiTrash className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {quizVariants.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  No hay variantes de quiz creadas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
