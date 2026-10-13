"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FormField, TextField } from "@/components/ui/form-field";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { PhoneInput } from "@/components/ui/phone-input";
import { SearchInput } from "@/components/ui/search-input";
import { useForm } from "@/hooks/use-form";
import { useMounted } from "@/hooks/use-mounted";
import { useFlashing } from "@/lib/flash";
import { isIndianMobile } from "@/lib/phone";
import { notify } from "@/lib/toast";
import { addCustomer, deleteCustomer, updateCustomer, useCustomers, useQuotes } from "@/services/quotes";
import type { Customer } from "@/types/quote";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name").max(80),
  phone: z.string().refine((v) => !v || isIndianMobile(v), "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Enter a valid email"),
  address: z.string().trim().max(300),
});
type Values = { name: string; phone: string; email: string; address: string };

function CustomerForm({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const form = useForm<Values>(schema, { name: customer?.name ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "", address: customer?.address ?? "" });
  const submit = form.handleSubmit((v) => {
    const input = { name: v.name.trim(), phone: v.phone, email: v.email.trim(), address: v.address.trim() };
    if (customer) updateCustomer(customer.id, input);
    else addCustomer(input);
    notify.success(customer ? "Customer updated" : "Customer added");
    onClose();
  });
  return (
    <form onSubmit={submit} noValidate>
      <ModalHeader title={customer ? "Edit customer" : "Add customer"} description="Saved customers can be picked when you create a quote." />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="name" error={form.errors.name} className="sm:col-span-2"><TextField {...form.field("name", { filter: "name" })} placeholder="Meera Kapoor" autoComplete="off" /></FormField>
        <FormField label="Phone" htmlFor="phone" error={form.errors.phone}><PhoneInput id="phone" name="phone" value={form.values.phone} onChange={(v) => form.setValue("phone", v)} onBlur={() => form.blur("phone")} invalid={Boolean(form.errors.phone)} /></FormField>
        <FormField label="Email" htmlFor="email" error={form.errors.email}><TextField {...form.field("email", { filter: "email" })} type="email" placeholder="optional" /></FormField>
        <FormField label="Address" htmlFor="address" error={form.errors.address} className="sm:col-span-2"><TextField {...form.field("address")} placeholder="optional" /></FormField>
      </div>
      <ModalFooter border>
        <Button type="button" variant="neutral" size="xl" className="rounded-full px-6" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="brand" size="xl" className="rounded-full px-6" loading={form.submitting}>{customer ? "Save changes" : "Add customer"}</Button>
      </ModalFooter>
    </form>
  );
}

export function CustomersView() {
  const mounted = useMounted();
  const flashing = useFlashing();
  const { customers, loaded } = useCustomers();
  const { quotes } = useQuotes();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | undefined>();
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => !q || `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q));
  }, [customers, query]);

  const openForm = (c?: Customer) => { setEditing(c); setOpen(true); };

  const columns: Column<Customer>[] = [
    { id: "name", header: "Customer", cell: (c) => <div className="min-w-0"><p className="font-semibold text-ink">{c.name}</p><p className="truncate text-xs text-slate-500">{c.address || "—"}</p></div> },
    { id: "contact", header: "Contact", cell: (c) => <div className="text-sm text-ink"><p>{c.phone || "—"}</p><p className="text-xs text-slate-500">{c.email}</p></div> },
    { id: "quotes", header: "Quotes", cell: (c) => <span className="text-sm text-ink">{quotes.filter((q) => q.customerId === c.id).length}</span> },
    {
      id: "actions", header: <span className="sr-only">Actions</span>, className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${c.name}`} onClick={() => openForm(c)}><Pencil /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${c.name}`} onClick={() => { if (window.confirm(`Delete ${c.name}? Their quotes are kept.`)) { deleteCustomer(c.id); notify.success("Customer deleted"); } }}><Trash2 /></Button>
        </div>
      ),
    },
  ];

  if (!mounted) return null;
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="People you've quoted, ready to pick next time." actions={<Button type="button" variant="brand" size="xl" className="rounded-full px-6" onClick={() => openForm()}><Plus />Add customer</Button>} />
      <SearchInput value={query} onValueChange={setQuery} placeholder="Search name, phone, email" clearable tone="white" className="w-full lg:w-72" />
      <DataTable columns={columns} rows={rows} rowId={(c) => c.id} selectable={false} pageSize={8} rowClassName={(c) => (flashing.has(c.id) ? "row-flash" : undefined)} emptyMessage={!loaded ? "Loading customers…" : customers.length ? "No customers match." : "No customers yet."} footerLabel={({ from, to, total }) => <>Showing <b className="text-ink">{from}–{to}</b> of <b className="text-ink">{total}</b> customers</>} />
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit customer" : "Add customer"} className="max-w-[620px]">
        <CustomerForm key={editing?.id ?? "new"} customer={editing} onClose={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
