import Header from '@/components/header'
import { getTranslation } from '@/lib/i18n'

type Props = {
  params: { locale: string }
}

export default async function MainPage({ params: { locale } }: Props) {
  const { t } = await getTranslation(locale)
  
  return (
    <main className="min-h-screen w-full bg-gray-50">
      <Header />
      <div className="p-4">
        <h1>{t('home')}</h1>
      </div>
    </main>
  )
}