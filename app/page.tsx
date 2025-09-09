import Header from '@/components/header'




export default async function MainPage() {
  
  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header />
      <div className="p-4">
        <h1>{"Home"}</h1>
      </div>
    </main>
  )
}