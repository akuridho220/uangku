import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountsTab } from "@/components/setup/AccountsTab"
import { CategoriesTab } from "@/components/setup/CategoriesTab"
import { CashflowsTab } from "@/components/setup/CashflowsTab"
import { ImportTab } from "@/components/setup/ImportTab"
import { useSearchParams } from "react-router-dom"
import { BackupTab } from "@/components/setup/BackupTab"

export default function SetupPage() {
  const [searchParams] = useSearchParams()
  const initialTab = ["account", "kategori", "cashflow", "data"].includes(searchParams.get("tab") ?? "")
    ? (searchParams.get("tab") as string)
    : "account"
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Set Up</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur account, kategori, dan cashflow.
        </p>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="kategori">Kategori</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <AccountsTab />
        </TabsContent>
        <TabsContent value="kategori" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="cashflow" className="mt-4">
          <CashflowsTab />
        </TabsContent>
        <TabsContent value="data" className="mt-4 space-y-8">
          <BackupTab />
          <ImportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}