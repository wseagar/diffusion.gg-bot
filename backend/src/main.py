import random
import sentry_sdk
import os
from pathlib import Path
import sys
from timeit import default_timer as timer



sys.path.append(str(Path(__file__).parent.parent))

print(bytes(os.getenv("STAGE"), "utf-8"))
if os.getenv("STAGE") != "dev":
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        traces_sample_rate=1.0,
    )

from imaginairy import (
    imagine,
    imagine_image_files,
    ImaginePrompt,
    WeightedPrompt,
    generate_caption,
)
from imaginairy.schema import LazyLoadingImage
import logging.config
from time import sleep
import time
import psycopg2
import psycopg2.extras
import boto3
import sys
from datetime import datetime
import io
import re
from transformers import pipeline, set_seed

db_params = {
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USERNAME"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
}
print(os.getenv("DB_NAME"))
print(os.getenv("STAGE"))
print(os.getenv("TRANSFORMERS_CACHE"))
conn = psycopg2.connect(**db_params)
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("CLOUDFLARE_URL"),
    aws_access_key_id=os.getenv("CLOUDFLARE_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("CLOUDFLARE_SECRET_ACCESS_KEY"),
)

import hashlib


def get_iso_date_string():
    return f'{datetime.now():%Y-%m-%dT%H:%M:%SZ}'

def hash_string(string):
    """
    Return a SHA-256 hash of the given string
    """
    return hashlib.sha256(string.encode("utf-8")).hexdigest()


def configure_logging(level="INFO"):
    fmt = "%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s"

    LOGGING_CONFIG = {
        "version": 1,
        "disable_existing_loggers": True,
        "formatters": {
            "standard": {"format": fmt},
        },
        "handlers": {
            "default": {
                "level": "INFO",
                "formatter": "standard",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",  # Default is stderr
            },
        },
        "loggers": {
            "": {  # root logger
                "handlers": ["default"],
                "level": "WARNING",
                "propagate": False,
            },
            "imaginairy": {"handlers": ["default"], "level": level, "propagate": False},
            "transformers.modeling_utils": {
                "handlers": ["default"],
                "level": "ERROR",
                "propagate": False,
            },
        },
    }
    logging.config.dictConfig(LOGGING_CONFIG)


configure_logging()


# source:
# https://huggingface.co/Gustavosta/MagicPrompt-Stable-Diffusion
# https://huggingface.co/spaces/Gustavosta/MagicPrompt-Stable-Diffusion/tree/main
# https://huggingface.co/Gustavosta/MagicPrompt-Stable-Diffusion/tree/main

gpt2_pipe = pipeline(
    "text-generation", model="Gustavosta/MagicPrompt-Stable-Diffusion", tokenizer="gpt2"
)


def prompt_juicer(starting_text, seed):
    print("[PROMPT_JUCIER_INPUT] ", starting_text)
    set_seed(seed)

    if starting_text == "":
        starting_text = "a landscape of"

    response = gpt2_pipe(
        starting_text, max_length=random.randint(60, 90), num_return_sequences=1
    )
    print("[PROMPT_JUCIER_RAW] ", response)
    response_list = []
    for x in response:
        resp = x["generated_text"].strip()
        if (
            resp != starting_text
            and len(resp) > (len(starting_text) + 4)
            and resp.endswith((":", "-", "—")) is False
        ):
            response_list.append(resp + "\n")

    response_end = "\n".join(response_list)
    response_end = re.sub("[^ ]+\.[^ ]+", "", response_end)
    response_end = response_end.replace("<", "").replace(">", "")

    if response_end == "":
        print("[PROMPT_JUCIER_FAILED] ", starting_text)
        return starting_text
    else:
        print("[PROMPT_JUCIER_OUTPUT] ", response_end)
        return response_end


def inference(model_inputs: dict):
    raw_prompt = model_inputs.get("prompt", None)
    prompt = raw_prompt
    prompt_engineer = model_inputs.get("prompt_engineer", False)
    prompt_engineer_seed = model_inputs.get("prompt_engineer_seed", None)
    n_samples = model_inputs.get("n_samples", 5)
    height = model_inputs.get("height", 512)
    width = model_inputs.get("width", 512)
    scale = model_inputs.get("scale", 7.5)
    seed = model_inputs.get("seed", 42)
    img2img_url = model_inputs.get("img2img_url", None)
    img2img_strength = model_inputs.get("img2img_strength", 0.75)
    upscale = model_inputs.get("upscale", False)
    fix_faces = model_inputs.get("fix_faces", False)
    sampler = model_inputs.get("sampler", "ddim")
    ddim_steps = model_inputs.get("ddim_steps", 50)
    mask_prompt = model_inputs.get("mask_prompt", None)
    # keep | replace
    mask_mode = model_inputs.get("mask_mode", None)

    # other samplers are busted for img2img
    if img2img_url:
        sampler = "ddim"

    if prompt_engineer:
        if prompt_engineer_seed == None:
            prompt_engineer_seed = random.randint(100, 1000000)
        prompt = str(prompt_juicer(prompt, prompt_engineer_seed)).replace("\n", "")

    weighted_prompts = []
    if (prompt_engineer):
        weighted_prompts.append(WeightedPrompt(raw_prompt, 1.5))
    weighted_prompts.append(WeightedPrompt(prompt, 1))
    
    prompt_hash = hash_string(prompt)
    filenames = []
    imagine_prompts = []

    init_image = None
    if img2img_url:
        init_image = LazyLoadingImage(url=img2img_url)

    for i in range(n_samples):
        filenames.append(
            f"{datetime.today().strftime('%Y/%m/%d')}/{prompt_hash}_{str(int(time.time()))}_{i}.webp"
        )
        imagine_prompts.append(
            ImaginePrompt(
                weighted_prompts,
                steps=ddim_steps,
                prompt_strength=scale,
                height=height,
                width=width,
                seed=seed + i,
                init_image=init_image,
                init_image_strength=1 - img2img_strength,
                sampler_type=sampler,
                upscale=upscale,
                fix_faces=fix_faces,
                mask_prompt=mask_prompt,
                mask_mode=mask_mode,
            )
        )

    urls = []
    nsfw = []
    for i, result in enumerate(imagine(imagine_prompts)):
        pil_image = result.img
        if result.upscaled_img:
            pil_image = result.upscaled_img
        in_mem_file = io.BytesIO()
        pil_image.save(in_mem_file, format="webp")
        in_mem_file.seek(0)

        urls.append("https://cdn.diffusion.gg/" + filenames[i])
        if result.is_nsfw is None:
            print("is_nsfw should NOT be none check imaginary config")
            result.is_nsfw = False

        nsfw.append(result.is_nsfw)

        # Upload image to s3
        s3.upload_fileobj(in_mem_file, "diffusion-gg", filenames[i])
    return {
        "success": True,
        "urls": urls,
        "nsfw": nsfw,
        "inputs": {
            "raw_prompt": raw_prompt,
            "prompt": prompt,
            "prompt_engineer": prompt_engineer,
            "prompt_engineer_seed": prompt_engineer_seed,
            "n_samples": n_samples,
            "height": height,
            "width": width,
            "scale": scale,
            "seed": seed,
            "img2img_url": img2img_url,
            "img2img_strength": img2img_strength,
            "upscale": upscale,
            "fix_faces": fix_faces,
            "sampler": sampler,
            "ddim_steps": ddim_steps,
            "mask_prompt": mask_prompt,
            "mask_mode": mask_mode,
        },
    }


def img2prompt(model_inputs: dict):
    url = model_inputs.get("img2prompt_url")
    img = LazyLoadingImage(url=url)
    result = generate_caption(img.copy())
    return {"prompt": result}


while True:
    pull_job_sql = """UPDATE jobs
                SET running = true, started_at = current_timestamp
                WHERE id IN (
                    SELECT id
                    FROM jobs
                    WHERE running = false
                    ORDER BY prio DESC, created_at ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1
                )
                RETURNING *"""

    insert_img_sql = "INSERT INTO images values (gen_random_uuid(), %s, %s, %s)"

    cur.execute(pull_job_sql)
    queue_item = cur.fetchone()
    start_timer = timer()
    start_datetime = get_iso_date_string()

    if queue_item is None:
        print("No jobs")
        conn.commit()
        sleep(1)
        continue
    print("queue says to process id: ", queue_item["id"])

    try:
        msg_type = queue_item["args"]["type"]

        if msg_type == "img2prompt":
            results = img2prompt(queue_item["args"])
            
            end_timer = timer()
            end_datetime = get_iso_date_string()

            results["performance"] = {
                "runtime": end_timer - start_timer,
                "start": start_datetime,
                "end": end_datetime
            }

            sql = """UPDATE jobs SET done = true, results=%s WHERE id = %s;"""
            cur.execute(
                sql,
                (
                    psycopg2.extras.Json(results),
                    queue_item["id"],
                ),
            )
            conn.commit()

        else:
            print("prompt: ", queue_item["args"]["prompt"])
            result = inference(queue_item["args"])

            end_timer = timer()
            end_datetime = get_iso_date_string()

            results["performance"] = {
                "runtime": end_timer - start_timer,
                "start": start_datetime,
                "end": end_datetime
            }

            for i in range(len(result["urls"])):
                cur.execute(
                    insert_img_sql,
                    (queue_item["id"], result["urls"][i], result["nsfw"][i]),
                )

            sql = """UPDATE jobs SET done = true, results=%s WHERE id = %s;"""
            cur.execute(
                sql,
                (
                    psycopg2.extras.Json(result),
                    queue_item["id"],
                ),
            )
            conn.commit()

    except Exception as e:
        print("_____________CRASH___________")
        sentry_sdk.capture_exception(e)
        print(e)
        sql = """UPDATE jobs SET done = true, logs=%s WHERE id =%s;"""
        cur.execute(sql, (str(e), queue_item["id"]))
        conn.commit()
        sys.exit(1)
