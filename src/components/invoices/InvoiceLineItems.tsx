import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  currencySymbol?: string;
}

export function InvoiceLineItems({ items, onChange, currencySymbol = "₹" }: Props) {
  const addItem = () => {
    onChange([
      ...items,
      { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unit_price") {
          updated.total = Number(updated.quantity) * Number(updated.unit_price);
        }
        return updated;
      })
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(reordered);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[32px_1fr_80px_100px_100px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <div />
        <div>Description</div>
        <div>Qty</div>
        <div>Unit Price</div>
        <div>Total</div>
        <div />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="line-items">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`grid grid-cols-[32px_1fr_80px_100px_100px_40px] gap-2 items-center rounded-md p-1 ${
                        snapshot.isDragging ? "bg-accent shadow-md" : "bg-card"
                      }`}
                    >
                      <div {...provided.dragHandleProps} className="flex items-center justify-center cursor-grab">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                        className="h-9"
                      />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, "unit_price", Number(e.target.value))}
                        className="h-9"
                      />
                      <div className="text-sm font-medium tabular-nums px-2">
                        {currencySymbol}{item.total.toFixed(2)}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2">
        <Plus className="h-4 w-4 mr-1" /> Add Item
      </Button>
    </div>
  );
}
