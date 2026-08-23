import "dotenv/config"

import {
  access,
  readFile,
  stat,
} from "fs/promises"

import path from "path"

import { PrismaClient } from "@prisma/client"

import { put } from "@vercel/blob"

/* -------------------------------------------------------------------------- */
/* Prisma                                                                     */
/* -------------------------------------------------------------------------- */

function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim()

  if (!url) {
    throw new Error(
      "DATABASE_URL تنظیم نشده است."
    )
  }

  if (
    !/^postgres(?:ql)?:\/\//i.test(
      url
    )
  ) {
    throw new Error(
      "DATABASE_URL باید با postgresql:// یا postgres:// شروع شود."
    )
  }

  return url
}

const prisma =
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },

    log:
      process.env.NODE_ENV ===
      "development"
        ? ["error", "warn"]
        : ["error"],
  })

/* -------------------------------------------------------------------------- */
/* Local Storage                                                              */
/* -------------------------------------------------------------------------- */

function getUploadBase(): string {
  return path.resolve(
    process.env.UPLOAD_DIR ||
      path.join(
        process.cwd(),
        "storage",
        "uploads"
      )
  )
}

function resolveLocalPath(
  storageKey: string
): string {
  if (
    !storageKey ||
    typeof storageKey !== "string"
  ) {
    throw new Error(
      "storageKey نامعتبر است."
    )
  }

  const base =
    getUploadBase()

  const normalized =
    path.normalize(
      storageKey
    )

  /*
   * Security: prevent path traversal.
   */
  if (
    normalized === ".." ||
    normalized.startsWith(
      `..${path.sep}`
    ) ||
    path.isAbsolute(
      normalized
    )
  ) {
    throw new Error(
      `storageKey نامعتبر است: ${storageKey}`
    )
  }

  const target =
    path.resolve(
      path.join(
        base,
        normalized
      )
    )

  const basePrefix =
    base.endsWith(path.sep)
      ? base
      : `${base}${path.sep}`

  if (
    target !== base &&
    !target.startsWith(
      basePrefix
    )
  ) {
    throw new Error(
      `مسیر فایل خارج از UPLOAD_DIR است: ${storageKey}`
    )
  }

  return target
}

async function exists(
  filePath: string
): Promise<boolean> {
  try {
    await access(filePath)

    return true
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  const token =
    process.env
      .BLOB_READ_WRITE_TOKEN

  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN تنظیم نشده است."
    )
  }

  const uploadBase =
    getUploadBase()

  console.log("")
  console.log(
    "=============================================="
  )
  console.log(
    "Stone Catalog - Local Media -> Vercel Blob"
  )
  console.log(
    "=============================================="
  )
  console.log(
    `Local storage: ${uploadBase}`
  )
  console.log("")

  /*
   * Connect to PostgreSQL.
   */
  await prisma.$connect()

  console.log(
    "✓ اتصال به PostgreSQL برقرار شد."
  )

  /*
   * Get all media records.
   */
  const assets =
    await prisma.mediaAsset.findMany({
      orderBy: {
        createdAt: "asc",
      },
    })

  console.log(
    `✓ تعداد MediaAsset ها: ${assets.length}`
  )

  console.log("")

  let migrated = 0
  let skipped = 0
  let missing = 0
  let failed = 0

  /* ------------------------------------------------------------------------ */
  /* Process each MediaAsset                                                  */
  /* ------------------------------------------------------------------------ */

  for (
    const asset of assets
  ) {
    const storageKey =
      asset.storageKey

    console.log("")
    console.log(
      `[${asset.id}] ${storageKey}`
    )

    try {
      /*
       * Only migrate application-managed
       * storage keys.
       *
       * Expected:
       *
       * 2026/uuid.webp
       */
      if (
        !storageKey ||
        storageKey.startsWith(
          "/"
        ) ||
        storageKey.includes(
          "://"
        )
      ) {
        console.log(
          "  SKIP: storageKey قابل Migration نیست."
        )

        skipped++

        continue
      }

      /*
       * Find corresponding Local file.
       */
      const localPath =
        resolveLocalPath(
          storageKey
        )

      if (
        !(await exists(
          localPath
        ))
      ) {
        console.log(
          `  MISSING: فایل Local پیدا نشد: ${localPath}`
        )

        missing++

        continue
      }

      /*
       * Verify that it is a regular file.
       */
      const fileInfo =
        await stat(
          localPath
        )

      if (
        !fileInfo.isFile()
      ) {
        console.log(
          "  SKIP: مسیر مشخص‌شده فایل نیست."
        )

        skipped++

        continue
      }

      /*
       * Read local file.
       */
      const buffer =
        await readFile(
          localPath
        )

      if (!buffer.length) {
        console.log(
          "  SKIP: فایل خالی است."
        )

        skipped++

        continue
      }

      console.log(
        `  Uploading: ${buffer.length} bytes`
      )

      /*
       * IMPORTANT:
       *
       * Keep exactly the same storageKey.
       *
       * Existing application URLs such as:
       *
       * /api/media/2026/example.webp
       *
       * will continue to work.
       */
      const uploadedBlob =
        await put(
          storageKey,
          buffer,
          {
            access:
              "private",

            token,

            contentType:
              asset.mimeType ||
              "image/webp",

            cacheControlMaxAge:
              31536000,

            /*
             * Re-running the migration should not fail
             * if the object already exists.
             */
            allowOverwrite:
              true,

            /*
             * Preserve the exact pathname.
             */
            addRandomSuffix:
              false,
          }
        )

      /*
       * Check the actual result returned by Vercel Blob.
       *
       * We intentionally do NOT call get() here.
       */
      if (
        !uploadedBlob ||
        !uploadedBlob.url ||
        !uploadedBlob.pathname
      ) {
        throw new Error(
          "Vercel Blob upload نتیجه معتبر برنگرداند."
        )
      }

      console.log(
        "  ✓ Migration موفق"
      )

      console.log(
        `  Blob pathname: ${uploadedBlob.pathname}`
      )

      migrated++
    } catch (error) {
      failed++

      console.error(
        "  ✗ Migration ناموفق:",
        error instanceof Error
          ? error.message
          : error
      )
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Summary                                                                  */
  /* ------------------------------------------------------------------------ */

  console.log("")
  console.log(
    "=============================================="
  )
  console.log(
    "Migration completed"
  )
  console.log(
    "=============================================="
  )

  console.log(
    `Total:          ${assets.length}`
  )

  console.log(
    `Migrated:       ${migrated}`
  )

  console.log(
    `Missing Local:  ${missing}`
  )

  console.log(
    `Skipped:        ${skipped}`
  )

  console.log(
    `Failed:         ${failed}`
  )

  console.log(
    "=============================================="
  )

  console.log("")

  /*
   * Return a non-zero exit code if anything failed.
   */
  if (failed > 0) {
    process.exitCode = 1
  }
}

/* -------------------------------------------------------------------------- */
/* Run                                                                        */
/* -------------------------------------------------------------------------- */

main()
  .catch((error) => {
    console.error("")
    console.error(
      "Migration failed:"
    )
    console.error(error)

    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })