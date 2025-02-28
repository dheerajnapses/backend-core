const serviceProvider = {
    awsCloudwatch: {
        enableAwsLogger: process.env.AWS_LOG_ENABLE === 'true',
        logGroupName: process.env.AWS_LOG_GROUP_NAME,
        logStreamName: process.env.AWS_LOG_STREAM_NAME,
        accessKeyId: process.env.AWS_LOG_ACCESS_KEY_ID,
        secretKey: process.env.AWS_LOG_SECRET_KEY,
        region: process.env.AWS_LOG_REGION
    },
    awsS3: {
        access_key_id: process.env.AWS_S3_ACCESS_KEY_ID,
        secret_access_key: process.env.AWS_S3_SECRET_ACCESS_KEY,
        region: process.env.AWS_S3_REGION,
        bucketName: process.env.AWS_S3_BUCKET_NAME
    },
    awsSQS: {
        accessKeyId: process.env.AWS_SQS_ACCESS_KEY_ID,
        accessKey: process.env.AWS_SQS_ACCESS_KEY,
        region: process.env.AWS_SQS_REGION,
        url: process.env.AWS_SQS_URL,
        arn: process.env.AWS_SQS_ARN,
        deadLetterQueue: process.env.AWS_SQS_DEAD_LETTER_QUEUE
    }
}