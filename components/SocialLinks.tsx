// components/SocialLinks.tsx
import React from 'react'

type SocialLinksProps = {
    size?: number
    className?: string
}

    export default function SocialLinks({ size = 20, className = '' }: SocialLinksProps) {
    return (
        <div className={`inline-flex items-center gap-3 ${className}`}>
            <a
                href="https://api.whatsapp.com/send?phone=5521974645594"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="hover:opacity-50"
            >
                <img
                width={size}
                height={size}
                src="https://img.icons8.com/ios/50/whatsapp--v1.png"
                alt="WhatsApp"
                />
            </a>

            <a
                href="https://www.instagram.com/_iscaisca/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:opacity-50"
            >
                <img
                width={size}
                height={size}
                src="https://img.icons8.com/ios/50/instagram-new--v1.png"
                alt="Instagram"
                />
            </a>
        </div>
    )
}
