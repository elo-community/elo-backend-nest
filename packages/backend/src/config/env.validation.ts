import { plainToClass } from 'class-transformer';
import { IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
    @IsString()
    @IsOptional()
    DB_HOST?: string;

    @IsNumber()
    @IsOptional()
    DB_PORT?: number;

    @IsString()
    @IsOptional()
    DB_USERNAME?: string;

    @IsString()
    @IsOptional()
    DB_PASSWORD?: string;

    @IsString()
    @IsOptional()
    DB_DATABASE?: string;

    @IsString()
    @IsOptional()
    JWT_SECRET?: string;

    @IsString()
    @IsOptional()
    AWS_ACCESS_KEY_ID?: string;

    @IsString()
    @IsOptional()
    AWS_SECRET_ACCESS_KEY?: string;

    @IsString()
    @IsOptional()
    AWS_REGION?: string;

    @IsString()
    @IsOptional()
    AWS_S3_BUCKET_NAME?: string;

    @IsString()
    @IsOptional()
    RPC_AMOY?: string;

    @IsString()
    @IsOptional()
    RPC_VERY?: string;

    @IsString()
    @IsOptional()
    ADMIN_PRIV_KEY?: string;

    @IsString()
    @IsOptional()
    SIGNER_PRIV_KEY?: string;

    @IsString()
    @IsOptional()
    DISTRIBUTOR_AMOY?: string;

    @IsString()
    @IsOptional()
    RWARD_POOL_AMOY?: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToClass(
        EnvironmentVariables,
        config,
        { enableImplicitConversion: true },
    );
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
} 