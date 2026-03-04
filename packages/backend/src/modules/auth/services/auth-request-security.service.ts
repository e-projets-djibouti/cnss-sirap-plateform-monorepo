import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

@Injectable()
export class AuthRequestSecurityService {
    constructor(private readonly config: ConfigService) { }

    getRefreshToken(req: Request, bodyRefreshToken?: string) {
        return bodyRefreshToken ?? req.cookies?.[this.refreshCookieName];
    }

    setRefreshCookie(res: Response, refreshToken: string) {
        const secure = this.config.get<boolean>('security.cookieSecure', false);
        const sameSite = this.config.get<'strict' | 'lax' | 'none'>(
            'security.cookieSameSite',
            'strict',
        );

        res.cookie(this.refreshCookieName, refreshToken, {
            httpOnly: true,
            secure,
            sameSite,
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    clearRefreshCookie(res: Response) {
        const secure = this.config.get<boolean>('security.cookieSecure', false);
        const sameSite = this.config.get<'strict' | 'lax' | 'none'>(
            'security.cookieSameSite',
            'strict',
        );

        res.clearCookie(this.refreshCookieName, {
            httpOnly: true,
            secure,
            sameSite,
            path: '/api/auth',
        });
    }

    assertTrustedOrigin(req: Request) {
        const allowedOrigins = this.config.get<string[]>('app.corsOrigins', []);
        if (allowedOrigins.length === 0) return;

        const origin = this.parseUrl(req.headers.origin);
        const referer = this.parseUrl(req.headers.referer);
        const allowed = allowedOrigins
            .map((value) => this.parseUrl(value))
            .filter((value): value is URL => value !== null);

        if (!origin && !referer) return;
        if (origin && this.isAllowedUrl(origin, allowed)) return;
        if (referer && this.isAllowedUrl(referer, allowed)) return;

        throw new ForbiddenException('Origine non autorisée');
    }

    private get refreshCookieName() {
        return this.config.get<string>('security.refreshCookieName', 'sirap_refresh_token');
    }

    private parseUrl(value: string | undefined): URL | null {
        if (!value) return null;
        try {
            return new URL(value);
        } catch {
            return null;
        }
    }

    private isAllowedUrl(candidate: URL, allowed: URL[]): boolean {
        return allowed.some((allowedUrl) => {
            const sameProtocol = candidate.protocol === allowedUrl.protocol;
            const samePort = this.effectivePort(candidate) === this.effectivePort(allowedUrl);
            const sameHost = candidate.hostname === allowedUrl.hostname;
            const equivalentLoopback =
                this.isLoopbackHost(candidate.hostname) && this.isLoopbackHost(allowedUrl.hostname);

            return sameProtocol && samePort && (sameHost || equivalentLoopback);
        });
    }

    private effectivePort(url: URL): string {
        if (url.port) return url.port;
        return url.protocol === 'https:' ? '443' : '80';
    }

    private isLoopbackHost(hostname: string): boolean {
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    }
}
