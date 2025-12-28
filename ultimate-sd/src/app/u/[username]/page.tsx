import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface Props {
    params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // Public profiles feature temporarily disabled - username field not in schema
    return {
        title: 'User Not Found | Ultimate SD',
    };
}

export default async function PublicProfilePage({ params }: Props) {
    // Public profiles feature temporarily disabled - username/isPublic/bio fields not in schema
    notFound();
}
