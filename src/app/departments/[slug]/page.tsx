import React from 'react';
import { DepartmentView } from '@/components/departments/DepartmentView';

export async function generateStaticParams() {
  return [
    { slug: 'c-and-p' },
    { slug: 'cb-civil' },
    { slug: 'cb-mep' },
    { slug: 'design' },
    { slug: 'planning' },
    { slug: 'site' },
  ];
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DepartmentPage({ params }: Props) {
  const { slug } = await params;
  return <DepartmentView slug={slug} />;
}
