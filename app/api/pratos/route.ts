// app/api/pratos/route.ts
import { NextResponse } from 'next/server';
import { createClientService } from '@/lib/supabase';

type NovoPrato = {
    id?: string;
    nome: string;
    preco: string | number;
    descricao: string;
    descricao_en: string;
    imagens?: string[];
    isActive?: boolean;
    is_pintxo?: boolean;
    is_outro?: boolean;
    is_drink?: boolean;
    is_alcoolico?: boolean;
    is_soft?: boolean;
    is_vegan?: boolean;
    is_vegetariano?: boolean;
    is_sobremesa?: boolean;
};

export async function GET() {
    try {
        const supabase = createClientService();
        const { data, error } = await supabase
            .from('Prato')
            .select('*')
            .eq('isActive', true)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('GET /pratos error:', error);
            return NextResponse.json(
                { error: 'DB error', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ pratos: data ?? [] });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            { error: 'Internal', details: msg },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Partial<NovoPrato>;
        const supabase = createClientService();

        // Minimal validation
        const missing: string[] = [];
        if (!body.nome) missing.push('nome');
        if (body.preco === undefined || body.preco === null || body.preco === '') missing.push('preco');
        if (!body.descricao) missing.push('descricao');
        if (!body.descricao_en) missing.push('descricao_en');

        if (missing.length) {
            return NextResponse.json(
                { error: 'Validation error', details: `Missing fields: ${missing.join(', ')}` },
                { status: 400 }
            );
        }

        const id =
            typeof body.id === 'string' && body.id.trim().length > 0
                ? body.id.trim()
                : globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;

        // Build insert payload
        const novoPrato: Record<string, unknown> = {
            id,
            nome: body.nome,
            preco: String(body.preco),
            descricao: body.descricao,
            descricao_en: body.descricao_en,
            ...(Array.isArray(body.imagens) ? { imagens: body.imagens } : {}),
            ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
        };

        // Include booleans only when the caller actually sent them
        const booleanKeys: Array<keyof NovoPrato> = [
            'is_pintxo',
            'is_outro',
            'is_drink',
            'is_alcoolico',
            'is_soft',
            'is_vegan',
            'is_vegetariano',
            'is_sobremesa',
        ];
        for (const k of booleanKeys) {
            const v = body[k];
            if (typeof v === 'boolean') {
                novoPrato[k] = v;
            }
        }

        const { data, error } = await supabase
            .from('Prato')
            .insert(novoPrato)
            .select('*')
            .single();

        if (error) {
            console.error('POST /pratos error:', error, { novoPrato });
            return NextResponse.json(
                { error: 'DB error', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ prato: data }, { status: 201 });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            { error: 'Internal', details: msg },
            { status: 500 }
        );
    }
}
