"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// import { DataTable } from "@/components/ui/data-table" // We might need to implement this generic table or use a simple one
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getApiPath } from "@/lib/utils"

type User = {
    id: string
    username: string
    ThaiName: string | null
    EngName: string | null
    role: string
    Section: string | null
    image_url: string | null
    email: string | null
}

export default function UsersPage() {
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    const [search, setSearch] = useState("")

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["users", search], // Add search to queryKey to refetch on change
        queryFn: async () => {
            const params = new URLSearchParams()
            if (search) params.append("search", search)
            const res = await fetch(getApiPath(`/api/admin/users?${params.toString()}`))
            if (!res.ok) throw new Error("Failed to fetch users")
            return res.json()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(getApiPath(`/api/admin/users?id=${id}`), { method: "DELETE" })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            toast.success("User deleted successfully")
        },
        onError: () => {
            toast.error("Failed to delete user")
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-slate-500 text-sm">Manage user access and roles</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingUser(null)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                            </DialogHeader>
                            <UserForm
                                user={editingUser}
                                onSuccess={() => {
                                    queryClient.invalidateQueries({ queryKey: ["users"] })
                                    setIsOpen(false)
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Name (Thai)</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {user.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={getApiPath(user.image_url)} alt="" className="h-6 w-6 rounded-full object-cover bg-slate-100" />
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {user.username}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"}`}>
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell>{user.ThaiName || "-"}</TableCell>
                                <TableCell>{user.Section || "-"}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingUser(user)
                                        setIsOpen(true)
                                    }}>
                                        <Pencil className="h-4 w-4 text-blue-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        if (confirm("Are you sure?")) deleteMutation.mutate(user.id)
                                    }}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function UserForm({ user, onSuccess }: { user: User | null, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        username: user?.username || "",
        password: "",
        role: user?.role || "USER",
        ThaiName: user?.ThaiName || "",
        EngName: user?.EngName || "",
        email: user?.email || "",
        section: user?.Section || "",
        image_url: user?.image_url || ""
    })

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const method = user ? "PUT" : "POST"
            const body = user ? { ...data, id: user.id } : data
            const res = await fetch(getApiPath("/api/admin/users"), {
                method,
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" }
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to save")
            }
        },
        onSuccess: () => {
            toast.success(user ? "User updated successfully" : "User created successfully")
            onSuccess()
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save user")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Username</Label>
                    <Input
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        disabled={!!user}
                        required
                    />
                </div>
                <div>
                    <Label>Password {user && "(Leave blank to keep)"}</Label>
                    <Input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required={!user}
                    />
                </div>
                <div>
                    <Label>Role</Label>
                    <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Section</Label>
                    <Input
                        value={formData.section}
                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Thai Name</Label>
                    <Input
                        value={formData.ThaiName}
                        onChange={e => setFormData({ ...formData, ThaiName: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Eng Name</Label>
                    <Input
                        value={formData.EngName}
                        onChange={e => setFormData({ ...formData, EngName: e.target.value })}
                    />
                </div>
                <div className="col-span-2">
                    <Label>Email</Label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div className="col-span-2">
                    <Label>Image URL</Label>
                    <Input
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://..."
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save User"}
                </Button>
            </div>
        </form>
    )
}
