import { Metadata } from 'next';
import { AiAssistantPage } from '@/components/ai-assistant/ai-assistant-page';

export const metadata: Metadata = {
  title: 'AI Asistan | TourTrip',
  description: 'Yapay zeka destekli seyahat planlama ve kişiselleştirilmiş öneriler',
};

export default function AiAssistantRoute() {
  return <AiAssistantPage />;
}



