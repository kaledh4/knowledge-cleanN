export class ApiClient {
    static async resetPassword(token: string, newPassword: string): Promise<void> {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reset password');
        }
    }
}
